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
import {app, autoUpdater} from 'electron';
import AutoLaunch from 'auto-launch';
import fs from 'fs';
import path from 'path';
// import autoUpdater from 'update-electron-app';
import pac from './package.json';
import {SocketEvents} from './sockets/constants';
import * as evenCallbacks from './sockets/eventCallbacks';
import {CurrentOS} from './enums';
import InitApp from './actions/initApp';
import setAppEnvs from './actions/setAppEnvs';
import registerAgentWithVMWare, {refreshSession} from "./actions/registerAgentWithVMWare";
import io from 'socket.io-client';

import logger from './utils/logger';
const appVersion = pac.version;

let updateTimer: any = null;

const AUTO_UPDATE_URL =
  'https://api.update.rocks/update/github.com/DamieUk/jbbf-agent-releases/stable/' + process.platform + '/' + appVersion;

const isOnInstalledApp = fs.existsSync(path.resolve(path.dirname(process.execPath), '..', 'update.exe'));

const gotTheLock = app.requestSingleInstanceLock();

let isAppRunning = false;

if (!gotTheLock) {
  app.quit();
} else {
  app.setName(pac.productName);

  const quitAndInstall = () => {
    try {
      autoUpdater.quitAndInstall();
    } catch (e) {
      logger.error(e)
    }
  }

  const checkForUpdates = () => autoUpdater.checkForUpdates();

  if (isOnInstalledApp) {
    autoUpdater.setFeedURL({
      url: AUTO_UPDATE_URL,
    });

    autoUpdater.on("checking-for-update", () => {
      logger.log('checking-for-update')
    });

    autoUpdater.on("update-not-available", () => {
      logger.log('update-not-available')
    });


    autoUpdater.on("update-available", (info: any) => {
      logger.log('update-available..... quiting and restarting', info);
      quitAndInstall();
    });

    autoUpdater.on("update-downloaded", () => {
      logger.log('update-downloaded');
      quitAndInstall();
    });

    updateTimer = setInterval(checkForUpdates, 1000 * 60 * 5);
  }

  const initWeSockets = async (socketServerUrl: string | null) => {
    if (socketServerUrl) {
      logger.info('Connecting to websocket server...');

      const socket = io(socketServerUrl, {
        transports: ['websocket'],
        rejectUnauthorized: false,
        secure: false,
      });

      socket.on(SocketEvents.connect, evenCallbacks.onConnect(socketServerUrl));
      socket.on(SocketEvents.connectError, logger.error);
      socket.on(SocketEvents.runTest, evenCallbacks.onRunTest);

      return socket;
    } else {
      logger.info('Websocket server is not defined...');
      return null
    }
  };

  async function runApp() {
    app.setLoginItemSettings({
      openAsHidden: true,
      openAtLogin: true,
    });


    if (!isAppRunning) {
      if (!app.getLoginItemSettings().wasOpenedAsHidden) {
        app.setLoginItemSettings({
          openAsHidden: true,
        });
      }

      logger.info('Starting app...');
      logger.info(`App Version: ${pac.version}`);

      const ENV_VARS = await InitApp(app, CurrentOS);

      logger.info(ENV_VARS);

      await setAppEnvs(ENV_VARS);
      await registerAgentWithVMWare(ENV_VARS);
      await initWeSockets(ENV_VARS.SOCKET_SERVER_URL);
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
    if (process.platform !== 'darwin') {
      app.quit();
      isAppRunning = false;
      refreshSession.stopSession();
      if (isOnInstalledApp) {
        clearInterval(updateTimer);
        quitAndInstall();
      }
    }
  });

  if (process.env.E2E_BUILD === 'true') {
    // eslint-disable-next-line promise/catch-or-return
    app.whenReady().then(runApp);
  } else {
    app.on('ready', runApp);
    if (isOnInstalledApp) autoUpdater.checkForUpdates();
    let autoLaunch = new AutoLaunch({
      name: pac.productName,
      path: app.getPath('exe'),
      isHidden: true
    });
    autoLaunch.isEnabled().then((isEnabled) => {
      if (!isEnabled) autoLaunch.enable();
    });
  }

  app.on('activate', runApp);
}
