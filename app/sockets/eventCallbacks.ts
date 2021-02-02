import fs from "fs";
import logger from '../utils/logger';
import {IAnyShape} from "global-shapes";
import {request} from "../utils/request";
import {downloadScript, executeScript} from "../utils/execute";
import {IAppEnvironments} from "env-enums";
import path from "path";

export function onConnect(url: string) {
  return () => logger.info(
    `Websocket: Connect ->>>> Successfully connected to websocket server ${url}!`
  );
}

interface ICommand {
  jobId: number;
  commandName: string;
  commandParams?: IAnyShape;
}

export function onRunCommand<E extends IAppEnvironments>(envs: E) {
  return async function <P extends ICommand>(event: P) {
    const {jobId, commandName, commandParams} = event;
    const {data: scriptData} = await request.scripts.GET(`/scripts/agent/${commandName}`);
    const scriptPath: string = await downloadScript(
      envs.SCRIPT_SERVER_URL + scriptData.filePath,
      path.resolve(envs.SCRIPTS_EXE_FOLDER, scriptData.fileName)
    );
    if (!scriptPath) {
      logger.error(`${scriptData.fileName} couldn't be found. Script execution is stopped.`);
      return null;
    }
    const isJobMovedToReceived = await request.apiServer.POST(`/agent-jobs/${jobId}/receive`);
    if (!isJobMovedToReceived) {
      logger.error(`JobId - ${jobId} -> is completed already or has error.`);
      return null;
    }
    const removeSavedScriptFile = () => {
      return fs.unlink(scriptPath, (err) => { // remove executed script file,
        if (err) {
          console.log(`Script file ${scriptPath} doesnt exist already`);
          return;
        }
      })
    }

    const completeJob = async (message: any, error?: any) => {
      try {
        await request.apiServer.POST(
        `/agent-jobs/${jobId}/complete`,
        {data: error ? { error: { message: error, stacktrace: '' } } : { data: { message } }}
        );
      } catch (er) {
        logger.error(`Failed to complete job - ${jobId}. -> `, er)
      }
      return removeSavedScriptFile();
    }

    return await executeScript(scriptPath, commandParams)
      .then(message => completeJob(message))
      .catch(error => completeJob(undefined, error))

  }
}
