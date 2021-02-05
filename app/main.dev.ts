/* eslint global-require: off, no-console: off */

import {IAppEnvironments} from "env-enums";
import express from "express";

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import fs from 'fs';
import pac from './package.json';
import {SocketEvents} from './sockets/constants';
import * as evenCallbacks from './sockets/eventCallbacks';
import {CurrentOS, PROJECT_PATH, PROJECT_LOGS_PATH, PROGRAM_DATA_PATH} from './enums';
import InitApp from './actions/initApp';
import setAppEnvs from './actions/setAppEnvs';
import registerAgentWithVMWare from "./actions/registerAgentWithVMWare";
import io from 'socket.io-client';

import logger from './utils/logger';
import {AgentSession} from "./utils/session";
import path from "path";

// const appVersion = pac.version;

// let updateTimer: any = null;
//
// const AUTO_UPDATE_URL =
//   'https://api.update.rocks/update/github.com/DamieUk/jbbf-agent-releases/stable/' + process.platform + '/' + appVersion;

// const isOnInstalledApp = process.env.NODE_ENV !== 'development';
// logger.info(`App is in ${process.env.NODE_ENV} mode`);
// logger.info(`YAY!! we are on new version ${appVersion}`);



const createFolders = () => {
  return new Promise((res, rej) => {
    fs.mkdir(PROJECT_PATH, { recursive: true }, (err) => {
      if (err) rej(err);
    });

    fs.mkdir(path.resolve(PROGRAM_DATA_PATH), { recursive: true }, (err) => {
      if (err) rej(err);
      fs.mkdir(path.resolve(PROJECT_LOGS_PATH), { recursive: true }, (err) => {
        if (err) rej(err);
        res(true)
      });
    });
  })
}

let isAppRunning = false;

const initWeSockets = async (envs: IAppEnvironments) => {
  if (envs.SOCKET_SERVER_URL) {
    logger.info('Connecting to websocket server...');

    const socketUrl = `${envs.SOCKET_SERVER_URL}?accessToken=${AgentSession.getSession().accessToken}`

    const socket = io(socketUrl, {
      transports: ['websocket'],
      rejectUnauthorized: false,
      secure: false,
    });

    socket.on(SocketEvents.connect, evenCallbacks.onConnect(envs.SOCKET_SERVER_URL));
    socket.on(SocketEvents.connectError, logger.error);
    socket.on(SocketEvents.runCommand, evenCallbacks.onRunCommand(envs));

    return socket;
  } else {
    logger.info('Websocket server is not defined...');
    return null
  }
};

const runApp = async () => {
  if (!isAppRunning) {

    logger.info('Starting app...');
    logger.info(`App Version: ${pac.version}`);
    await createFolders();

    const ENV_VARS = await InitApp(CurrentOS);

    logger.info(ENV_VARS);

    await setAppEnvs(ENV_VARS);
    await registerAgentWithVMWare(ENV_VARS);
    await initWeSockets(ENV_VARS);
  }


  isAppRunning = true;
  return isAppRunning;
};

const app = express();

app.listen(4000,() => {
  runApp().then(() => logger.info('App is started'));
})

