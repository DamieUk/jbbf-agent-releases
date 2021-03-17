import path from 'path';
import { IAnyFunc } from 'global-shapes';
import logger from '../utils/logger';
import pac from '../../package.json';
import { PROJECT_PATH } from '../enums';
import { request } from '../utils/request';
import { executeScript, executeProgram } from '../utils/execute';
import { AgentSession } from '../utils/session';
import { IAppEnvironments } from 'env-enums';

const defaultUrl = 'https://file-storage-stage.jbbf.ch';

const requestProject = async (url: string) => {
  const FILE_SERVER_URL = AgentSession.getEnvs().FILE_STORAGE_SERVER_URL || defaultUrl;
  try {
    const data = await request.any.GET(FILE_SERVER_URL + `/agent/builds/${url}`);
    return data;
  } catch (e) {
    throw e;
  }
};

const checkUpdates = (envs: IAppEnvironments) => async () => {
  logger.info('Checking updates...');
  try {
    const _pac = await requestProject('package.json');
    logger.info(_pac.version, ' ', pac.version);
    if (_pac.version !== pac.version) {
      await executeScript(path.resolve(PROJECT_PATH, 'update.ps1'), {
        BaseURL: envs.FILE_STORAGE_SERVER_URL || defaultUrl,
      }).catch(err => err);
      await executeProgram(`C:/"Program Files/JBBFAgentService/restart.exe"`, []);
    }
  } catch (er) {
    logger.error(er);
  }
};

const updater = async (envs: IAppEnvironments): Promise<IAnyFunc> => {
  // Start checking
  try {
    await checkUpdates(envs)()
  } catch (e) {
    logger.error(`Update error exe: `, e);
    throw e;
  }
  const timer = setInterval(checkUpdates(envs), 120000); // 5 min
  return () => clearInterval(timer);
};

export default updater;
