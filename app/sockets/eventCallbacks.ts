import fs from "fs";
import logger from '../utils/logger';
import {IAnyShape} from "global-shapes";
import {request} from "../utils/request";
import {downloadScript, executeScript} from "../utils/execute";
import {IAppEnvironments} from "env-enums";
import path from "path";
import {readFile, writeFile} from "../utils/files";
import {AgentSession} from "../utils/session";

const getAllActiveScripts = (): Promise<IExecutedScriptsData[]> =>
  readFile(AgentSession.getEnvs().LAST_EXEC_SCRIPTS_PATH).then(res => {
    const scripts: IExecutedScriptsData[] = JSON.parse(res || '[]');
    return scripts;
  });

export const executeNotCompletedScripts = async () => {
  const scripts: IExecutedScriptsData[] = await getAllActiveScripts();
  if (scripts.length) {

    return Promise.all(scripts.map(s => exeScriptCmd(s))).catch(err => {
      logger.error(`Couldn't not execute all active scripts: `, err);
    })
  } else {
    logger.info('No active scripts found. Continuing...');
    return ;
  }
}

export function onConnect(envs: IAppEnvironments) {
  return () => {
    logger.info(
      `Websocket: Connect ->>>> Successfully connected to websocket server ${envs.SOCKET_SERVER_URL}!`
    );
    return executeNotCompletedScripts()
  }
}

interface ICommand {
  jobId: number;
  commandName: string;
  commandParams?: IAnyShape;
}

interface IExecutedScriptsData {
  path: string;
  requiresReboot?: boolean;
  genId: string;
  params?: IAnyShape;
  commandName: string;
  status: 'active' | 'inactive';
  jobId: string | number;
}

function generateId(): string {
  return '_' + Math.random().toString(36).substr(2, 9);
}

const removeSavedScriptFile = (scriptPath: string) => {
  return fs.unlink(scriptPath, (err) => { // remove executed script file,
    if (err) {
      console.log(`Script file ${scriptPath} doesnt exist already`);
      return;
    }
  })
}

const completeJob = async (script: IExecutedScriptsData, message: any, error?: any) => {
  try {
    await request.apiServer.POST(
      `/agent-jobs/${script.jobId}/complete`,
      {data: error ? { error: { message: error, stacktrace: '' } } : { data: { message } }}
    );
  } catch (er) {
    logger.error(`Failed to complete job - ${script.jobId}. -> `, er);
  }
  await removeActiveScript(script)
  return removeSavedScriptFile(script.path);
}

const setActiveScript = async (envs: IAppEnvironments, script: IExecutedScriptsData) => {
  const activeScripts: IExecutedScriptsData[] = await getAllActiveScripts();
  const isAlreadyExecuting = !!activeScripts.find(s => s.commandName === script.commandName);
  if (!isAlreadyExecuting) {
    activeScripts.push(script);
    return writeFile(envs.LAST_EXEC_SCRIPTS_PATH, activeScripts)
  }
  return activeScripts;
}


const removeActiveScript = async (script: IExecutedScriptsData) => {
  const activeScripts: IExecutedScriptsData[] = await getAllActiveScripts();
  const newScripts = activeScripts.filter(s => s.commandName !== script.commandName);

  if (activeScripts.length > newScripts.length) {
    return writeFile(AgentSession.getEnvs().LAST_EXEC_SCRIPTS_PATH, newScripts)
  }
  return activeScripts;
}

const exeScriptCmd = (script: IExecutedScriptsData) => {
  return executeScript(script.path, script.params)
    .then(message => completeJob(script, message))
    .catch(() => completeJob(script, `Completing job ${script.jobId} that has error`))
}

export function onRunCommand<E extends IAppEnvironments>(envs: E) {
  return async function <P extends ICommand>(event: P) {
    const {jobId, commandName, commandParams} = event;
    let scriptData = null;
    const customScriptId = generateId();
    try {
      const script = await request.scripts.GET(`/scripts/agent/${commandName}`);
      scriptData = script.data;
      scriptData.genId = customScriptId;
    } catch (e) {
      logger.error(`${commandName} couldn't be found is storage. Script execution is stopped.`);
      return ;
    }

    const scriptPath: string = await downloadScript(
      envs.SCRIPT_SERVER_URL + scriptData.filePath,
      path.resolve(envs.SCRIPTS_EXE_FOLDER, `${scriptData.genId}_${scriptData.fileName}`)
    );

    if (!scriptPath) {
      logger.error(`${scriptData.fileName} couldn't be found in agent. Script execution is stopped.`);
      return null;
    }

    const isJobMovedToReceived = await request.apiServer.POST(`/agent-jobs/${jobId}/receive`);

    if (!isJobMovedToReceived) {
      logger.error(`JobId - ${jobId} -> is completed already or has error.`);
      await removeSavedScriptFile(scriptPath);
      return null;
    }

    const currentScript: IExecutedScriptsData = {
      commandName: commandName,
      params: commandParams,
      jobId,
      genId: customScriptId,
      status: 'active',
      path: scriptPath,
      requiresReboot: scriptData.requiresReboot
    }

    await setActiveScript(envs, currentScript);

    return exeScriptCmd(currentScript)
  }
}
