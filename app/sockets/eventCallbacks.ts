import fs from "fs";
import logger from '../utils/logger';
import {IAnyShape} from "global-shapes";
import {request} from "../utils/request";
import {downloadScript, executeScript} from "../utils/execute";
import {IAppEnvironments} from "env-enums";
import path from "path";
import {readFile, writeFile} from "../utils/files";
import {AgentSession} from "../utils/session";

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

const getAllRebootingScripts = (): Promise<IExecutedScriptsData[]> =>
  readFile(AgentSession.getEnvs().REBOOT_SCRIPTS_PATH).then(res => {
    const scripts: IExecutedScriptsData[] = JSON.parse(res || '[]');
    return scripts;
  }).catch(() => logger.error('Could not read last active script'));

export function onConnect(envs: IAppEnvironments) {
  return () => {
    logger.info(
      `Websocket: Connect ->>>> Successfully connected to websocket server ${envs.SOCKET_SERVER_URL}!`
    );
    return completeJobsAfterReboot();
  }
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
}

const setRebootingScript = async (envs: IAppEnvironments, script: IExecutedScriptsData) => {
  const scripts: IExecutedScriptsData[] = await getAllRebootingScripts();
  if (script.requiresReboot) {
    scripts.push(script);
    return writeFile(envs.REBOOT_SCRIPTS_PATH, JSON.stringify(scripts))
      .catch((er) => logger.error('Could not write last reboot-script data: ', er))
  }
  return scripts;
}


const removeRebootScript = async (script: IExecutedScriptsData) => {
  const scripts: IExecutedScriptsData[] = await getAllRebootingScripts();
  const newScripts = scripts.filter(s => s.commandName !== script.commandName);

  if (scripts.length !== newScripts.length) {
    return writeFile(AgentSession.getEnvs().REBOOT_SCRIPTS_PATH, JSON.stringify(newScripts))
      .catch((er) => logger.error('Could not update last reboot-script data: ', er))
  }
  return scripts;
}

const completeJobsAfterReboot = async () => {
  const scripts: IExecutedScriptsData[] = await getAllRebootingScripts();
  await Promise.all(scripts.map(s =>
    completeJob(s, `Completed script "${s.commandName}" after rebooting.`)
      .then(() => removeRebootScript(s))
  ))
    .catch(err => logger.error('Could complete all reboot-scripts: ', err))
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
      requiresReboot: !!scriptData.requiresReboot
    };

    await setRebootingScript(envs, currentScript);

    return exeScriptCmd(currentScript)
  }
}
