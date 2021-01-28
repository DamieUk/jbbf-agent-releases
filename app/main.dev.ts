/* eslint global-require: off, no-console: off */

import {IAppEnvironments} from "env-enums";

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
process.env.GH_TOKEN = 'f206f76883f45b6fa4bf5e21affe64184da73d9f';
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import {app} from 'electron';
import AutoLaunch from 'auto-launch';
import { autoUpdater } from "electron-updater"
import pac from './package.json';
import {SocketEvents} from './sockets/constants';
import * as evenCallbacks from './sockets/eventCallbacks';
import {CurrentOS} from './enums';
import InitApp from './actions/initApp';
import setAppEnvs from './actions/setAppEnvs';
import registerAgentWithVMWare, {refreshSession} from "./actions/registerAgentWithVMWare";
import io from 'socket.io-client';

import logger from './utils/logger';
import {AgentSession} from "./utils/session";
const appVersion = pac.version;

let updateTimer: any = null;

const AUTO_UPDATE_URL =
  'https://api.update.rocks/update/github.com/DamieUk/jbbf-agent-releases/stable/' + process.platform + '/' + appVersion;

const isOnInstalledApp = process.env.NODE_ENV !== 'development';
logger.info(`App is in ${process.env.NODE_ENV} mode`);
logger.info(`YAY!! we are on new version ${appVersion}`);

const gotTheLock = app.requestSingleInstanceLock();

let isAppRunning = false;

if (!gotTheLock) {
  app.quit();
} else {
  app.setName(pac.productName);
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

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
      "provider": "generic",
      "url": AUTO_UPDATE_URL,
      "token": "f206f76883f45b6fa4bf5e21affe64184da73d9f",
      "private": false
    });

    autoUpdater.on("checking-for-update", () => {
      logger.log('checking-for-update')
    });

    autoUpdater.on("update-available", () => {
      logger.log('update-available...Please reboot your device')
    });

    autoUpdater.on("update-not-available", () => {
      logger.log('update-not-available')
    });

    autoUpdater.on("update-downloaded", () => {
      quitAndInstall();
    });

    autoUpdater.on("error", (err) => {
      logger.error('New version not found', err);
      logger.debug(err);
    });

    updateTimer = setInterval(checkForUpdates, 1000 * 60 * 2);
  }

  const initWeSockets = async (envs: IAppEnvironments) => {
    if (envs.SOCKET_SERVER_URL) {
      logger.info('Connecting to websocket server...');

      const socketUrl = `${envs.SOCKET_SERVER_URL}?accessToken=${AgentSession.getSession().accessToken}`

      const socket = io(socketUrl, {
        transports: ['websocket'],
        rejectUnauthorized: false,
        secure: false,
      });

      socket.on(SocketEvents.connect, evenCallbacks.onConnect(socketUrl));
      socket.on(SocketEvents.connectError, logger.error);
      socket.on(SocketEvents.runCommand, evenCallbacks.onRunCommand(envs));

      return socket;
    } else {
      logger.info('Websocket server is not defined...');
      return null
    }
  };

  const runApp = async () => {
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
      await initWeSockets(ENV_VARS);
    }


    isAppRunning = true;
    return undefined;
  };

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
