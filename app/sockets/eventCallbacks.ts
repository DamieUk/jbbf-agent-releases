import logger from '../utils/logger';
import {IAnyShape} from "global-shapes";
import {request} from "../utils/request";
import { downloadScript, executeScript } from "../utils/execute";
import {IAppEnvironments} from "env-enums";

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
  return async function<P extends ICommand>(event: P) {
    const { jobId, commandName, commandParams } = event;
    try {
      const { data: scriptData } = await request.scripts.GET(`/scripts/agent/${commandName}`)
      await request.apiServer.POST(`/agent-jobs/${jobId}/receive`);
      const scriptPath: string = await downloadScript(envs.SCRIPT_SERVER_URL + scriptData.filePath, `${envs.SCRIPTS_EXE_FOLDER}/${scriptData.fileName}`);
      await executeScript(scriptPath, commandParams);
      await request.apiServer.POST(`/agent-jobs/${jobId}/complete`);
    } catch (e) {
      logger.error(e)
    }
  }
}
