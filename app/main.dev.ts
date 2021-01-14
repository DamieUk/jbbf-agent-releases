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
import { app, autoUpdater } from 'electron';
// import { autoUpdater } from 'electron-updater';
// import autoUpdater from 'update-electron-app';
import { SocketEvents } from './sockets/constants';
import socket from './sockets/socketInstance';
import * as evenCallbacks from './sockets/eventCallbacks';

import logger from './utils/logger';

const server = 'https://update.electronjs.org';
const feed = `${server}/DamieUk/jbbf-agent-releases/${process.platform}-${
  process.arch
}/${app.getVersion()}`;

autoUpdater.setFeedURL({
  url: feed,
});

logger.info(`Feed url ->>>>> ${autoUpdater.getFeedURL()}`);

// autoUpdater.requestHeaders = { 'PRIVATE-TOKEN': 'DR_tmZ9yztmfxQWWtXjn' };
// autoUpdater.autoDownload = true;
// autoUpdater.logger = logger;
// autoUpdater.autoInstallOnAppQuit = true;

// 'https://git.jbbf.ch/jbbf/jbbf-automation-agent/-/jobs/artifacts/master/raw/dist?job=build';

setInterval(() => {
  autoUpdater.checkForUpdates();
}, 60 * 1000);
//
// function sendStatusLogs(message: string) {
//   logger.info(message);
// }
//
// autoUpdater.on('checking-for-update', () => {
//   sendStatusLogs('Checking for update...');
// });
//
// autoUpdater.on('update-available', () => {
//   sendStatusLogs('Update available.');
// });
//
// autoUpdater.on('update-not-available', () => {
//   sendStatusLogs('Update not available.');
// });
//
// autoUpdater.on('error', () => {
//   sendStatusLogs('Error in auto-updater.');
// });
//
// autoUpdater.on('download-progress', (progressObj) => {
//   let logMessage = `Download speed: ${progressObj.bytesPerSecond}`;
//   logMessage = `${logMessage} - Downloaded ${parseInt(
//     progressObj.percent,
//     10
//   )}%`;
//   logMessage = `${logMessage} (${progressObj.transferred}/${progressObj.total})`;
//   sendStatusLogs(logMessage);
// });
//
// autoUpdater.on('update-downloaded', () => {
//   setTimeout(() => {
//     autoUpdater.quitAndInstall();
//   }, 1000);
// });

let isAppRunning = false;

const initWeSockets = async () => {
  if (!isAppRunning) isAppRunning = true;

  // autoUpdater.checkForUpdates();

  logger.info('Starting app...');
  logger.info(`App Version: ${app.getVersion()}`);
  logger.info('Connecting to websocket server...');

  socket.on(SocketEvents.connect, evenCallbacks.onConnect);
  socket.on(SocketEvents.connectError, logger.error);
  socket.on(SocketEvents.runTest, evenCallbacks.onRunTest);

  logger.info(
    'AutoLauncher is enabled. Agent will start automatically on system start.'
  );

  return socket;
};

async function runApp() {
  if (!isAppRunning && !app.getLoginItemSettings().wasOpenedAsHidden) {
    app.setLoginItemSettings({
      openAsHidden: true,
    });
  }
  if (!isAppRunning) await initWeSockets();

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
  }
});

if (process.env.E2E_BUILD === 'true') {
  // eslint-disable-next-line promise/catch-or-return
  app.whenReady().then(runApp);
} else {
  app.on('ready', runApp);
}

app.on('activate', runApp);
