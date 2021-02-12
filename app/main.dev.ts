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
import { mkDir, writeFile, isFileExist } from './utils/files';

const createFolders = async () => {
  await mkDir(PROJECT_PATH);
  await mkDir(PROGRAM_DATA_PATH);
  await mkDir(PROJECT_LOGS_PATH);
  return isFileExist(PROJECT_LOGS_MAIN_PATH).catch(() => writeFile(PROJECT_LOGS_MAIN_PATH, ''))
}

let isAppRunning = false;

const runApp = async () => {
  if (!isAppRunning) {

    logger.info('App is initializing...');
    logger.info(`App Version: ${pac.version}`);
    await createFolders();

    const ENV_VARS = await InitApp(CurrentOS);

    logger.info(ENV_VARS);

    await setAppEnvs(ENV_VARS);
    await registerAgentWithVMWare(ENV_VARS);
  }


  isAppRunning = true;
  return isAppRunning;
};

const app = express();

app.listen(4000,() => {
  logger.info('App is started')
  return runApp();
})

