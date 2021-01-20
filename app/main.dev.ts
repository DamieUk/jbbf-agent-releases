/* eslint global-require: off, no-console: off */

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
import {app} from 'electron';
import path from 'path';
import fs from 'fs';
import autoUpdater from 'update-electron-app';
import pac from '../package.json';
import { SocketEvents } from './sockets/constants';
import socket from './sockets/socketInstance';
import * as evenCallbacks from './sockets/eventCallbacks';
import { CurrentOS } from './enums';
import InitApp from './actions/initApp';
import setAppEnvs from './actions/setAppEnvs';
import { isFileExist } from './utils/files';
import registerAgentWithVMWare, { refreshSession } from "./actions/registerAgentWithVMWare";

import logger from './utils/logger';

logger.info(`Feed url ->>>>> DamieUk/jbbf-agent-releases`);
app.setName(pac.productName);


let isAppRunning = false;

const initWeSockets = async () => {
  logger.info('Connecting to websocket server...');

  socket.on(SocketEvents.connect, evenCallbacks.onConnect);
  socket.on(SocketEvents.connectError, logger.error);
  socket.on(SocketEvents.runTest, evenCallbacks.onRunTest);

  return socket;
};

async function runApp() {
  logger.info('MODE ->>>>', process.env.NODE_ENV);

  const isOnInstalledApp1 = await isFileExist(path.resolve(path.dirname(process.execPath), '..', 'update.exe')).catch(() => false)
  logger.info(path.dirname(process.execPath), path.resolve(path.dirname(process.execPath), '..', 'update.exe'), isOnInstalledApp1, fs.existsSync(path.resolve(path.dirname(process.execPath), '..', 'update.exe')));
  const isOnInstalledApp = process.env.NODE_ENV === 'development';
  logger.info('isOnInstalledApp ->>>>> ', isOnInstalledApp)

  if (isOnInstalledApp) {
    autoUpdater({
      repo: 'DamieUk/jbbf-agent-releases',
      updateInterval: '5 minutes',
      logger,
      notifyUser: true
    });
  }

  if (!isAppRunning && !app.getLoginItemSettings().wasOpenedAsHidden) {
    app.setLoginItemSettings({
      openAsHidden: true,
    });
  }

  if (!isAppRunning) {
    logger.info('Starting app...');
    logger.info(`App Version: ${pac.version}`);

    const ENV_VARS = await InitApp(app, CurrentOS);

    logger.info(ENV_VARS);

    await setAppEnvs(ENV_VARS);
    await registerAgentWithVMWare(ENV_VARS);
    await initWeSockets();
  }
  isAppRunning = true;
  return undefined;
}

app.setLoginItemSettings({
  openAsHidden: true,
  openAtLogin: true,
});

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
    isAppRunning = false;
    refreshSession.stopSession();
  }
});

if (process.env.E2E_BUILD === 'true') {
  // eslint-disable-next-line promise/catch-or-return
  app.whenReady().then(runApp);
} else {
  app.on('ready', runApp);
}

app.on('activate', runApp);
