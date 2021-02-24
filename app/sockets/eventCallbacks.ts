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

interface IActiveRebootShape { requiresReboot: IExecutedScriptsData[], activeScripts: IExecutedScriptsData[] }

  const INITIAL_REBOOT_ACTIVE_SHAPE: IActiveRebootShape = { requiresReboot: [], activeScripts: [] }

const getAllActiveScripts = (): Promise<IActiveRebootShape> =>
  readFile(AgentSession.getEnvs().REBOOT_SCRIPTS_PATH).then(res => {
    const scripts: IActiveRebootShape = JSON.parse(res || JSON.stringify(INITIAL_REBOOT_ACTIVE_SHAPE));
    return scripts;
  }).catch(() => logger.error('Could not read last reboot script'));

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
      {data:  { data: { message, errorMessage: error || null } }}
    );
  } catch (er) {
    logger.error(`Failed to complete job - ${script.jobId}. -> `, er);
  }
  await removeRebootActiveScripts(undefined, script);
  await removeSavedScriptFile(script.path)
}

const writeRebootActiveScripts = async (
  envs: IAppEnvironments,
  rebootScript?: IExecutedScriptsData,
  activeScript?: IExecutedScriptsData
) => {
  const allScripts = await getAllActiveScripts();
  const newData = allScripts;

  if (rebootScript && rebootScript.requiresReboot) {
    newData.requiresReboot.push(rebootScript);
  }

  if (activeScript) {
    newData.activeScripts.push(activeScript);
  }

  return writeFile(envs.REBOOT_SCRIPTS_PATH, JSON.stringify(newData))
    .catch((er) => logger.error('Could not write last reboot-script data: ', er))
}

const removeRebootActiveScripts = async (
  rebootScript?: IExecutedScriptsData,
  activeScript?: IExecutedScriptsData
) => {
  const allScripts = await getAllActiveScripts();

  let newRebootScripts = allScripts.requiresReboot;

  if (rebootScript) {
    // @ts-ignore
    newRebootScripts = newRebootScripts.filter(s => s.commandName !== rebootScript.commandName)
  }

  let newActiveScripts = allScripts.activeScripts;

  if (activeScript) {
    // @ts-ignore
    newActiveScripts = newActiveScripts.filter(s => s.commandName !== activeScript.commandName)
  }

  const newData = {
    requiresReboot: newRebootScripts,
    activeScripts: newActiveScripts,
  };

  return writeFile(AgentSession.getEnvs().REBOOT_SCRIPTS_PATH, JSON.stringify(newData))
    .catch((er) => logger.error('Could not update last reboot-active-script data: ', er))
}

const completeJobsAfterReboot = async () => {
  const { activeScripts, requiresReboot } = await getAllActiveScripts();
  await Promise.all(requiresReboot.map(s =>
    completeJob(s, `Completed script "${s.commandName}" after rebooting.`)
      .then(() => removeRebootActiveScripts(s))
  ))
    .catch(err => logger.error('Could complete all reboot-scripts: ', err));

  await Promise.all(activeScripts.map(s => exeScriptCmd(s)))
    .catch(err => logger.error('Could complete all active-scripts: ', err))
}

const exeScriptCmd = (script: IExecutedScriptsData) => {
  return executeScript(script.path, script.params)
    .then(message => {
      if (!script.requiresReboot) {
        return completeJob(script, message)
      }
      return undefined;
    })
    .catch((err) => {
      if (!script.requiresReboot) {
        return completeJob(script, `Completing job ${script.jobId} that has error`, err)
      }
      return undefined;
    })
}

export async function onRunCommand<E extends IAppEnvironments, P extends ICommand>(envs: E, event: P) {
  const {jobId, commandName, commandParams} = event;
  let scriptData = null;
  const customScriptId = generateId();
  try {
    const script = await request.scripts.GET(`/scripts/agent/${commandName}`);
    scriptData = script.data;
    scriptData.genId = customScriptId;
  } catch (e) {
    logger.error(`${commandName} couldn't be found is storage. Script execution is stopped.`, e);
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

  await writeRebootActiveScripts(
    envs,
    currentScript.requiresReboot ? currentScript : undefined,
    currentScript,
    );

  return exeScriptCmd(currentScript)
}
