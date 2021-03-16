/* eslint global-require: off, no-console: off */
// @ts-ignore
import express from "express";
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import pac from './package.json';
import logger from './utils/logger';
import {CurrentOS, PROJECT_PATH, PROJECT_LOGS_PATH, PROJECT_LOGS_MAIN_PATH, PROGRAM_DATA_PATH} from './enums';
import InitApp from './actions/initApp';
import setAppEnvs from './actions/setAppEnvs';
import registerAgentWithVMWare from "./actions/registerAgentWithVMWare";
import launchAutoUpdater from "./actions/launchAutoUpdater";
import { mkDir, writeFile, isFileExist } from './utils/files';
import { ServerHealthCheckService } from './utils/healthCheck';

const createFolders = async () => {
  await mkDir(PROJECT_PATH);
  await mkDir(PROGRAM_DATA_PATH);
  await mkDir(PROJECT_LOGS_PATH);
  return isFileExist(PROJECT_LOGS_MAIN_PATH).catch(() => writeFile(PROJECT_LOGS_MAIN_PATH, ''))
}

const runApp = async () => {
  logger.info('App is initializing...');
  logger.info(`App Version: ${pac.version}`);
  await createFolders();

  // const ENV_VARS = await InitApp(CurrentOS);

  // logger.info(ENV_VARS);
  //
  // await setAppEnvs(ENV_VARS);
  //
  // const healthCheckService = new ServerHealthCheckService();
  // const healthCheckUrl = ENV_VARS.API_SERVER_URL + '/api/v1/health-check';
  // const pollingInterval = 10000; /* 10 sec */
  // const pollingAttempts = 100;
  const stopCheckingLaunchAutoUpdater = await launchAutoUpdater();
  try {
    // await healthCheckService.waitUntilServerReady(healthCheckUrl, pollingInterval, pollingAttempts);
    // logger.info(ENV_VARS.API_SERVER_URL, ' server is ready');
    // await registerAgentWithVMWare(ENV_VARS);
  } catch (e) {
    logger.error('Server is unavailable ->> ', e);
    stopCheckingLaunchAutoUpdater();
    throw new Error('Server unavailable');
  }
};

const app = express();

app.listen(4000,() => {
  logger.info('App is started')
  return runApp();
})

