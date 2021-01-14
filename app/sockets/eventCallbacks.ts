// import cp from 'child_process';
import socket from './socketInstance';
import logger from '../utils/logger';

export function onConnect() {
  logger.info(
    `Websocket: Connect ->>>> Successfully connected to websocket server ws://jbbf-dev-socket.jbbf.ch!`
  );
  logger.info('Websocket info: ', socket);
}

export function onRunTest() {
  logger.info('on run test ->>> ', socket);
}
