// import cp from 'child_process';
import { WEBSOCKET_SERVER_URL } from './constants';
import socket from './socketInstance';
import logger from '../utils/logger';

export function onConnect() {
  logger.info(
    `Websocket: Connect ->>>> Successfully connected to websocket server ${WEBSOCKET_SERVER_URL}!`
  );
  logger.info('Websocket info: ', socket);
}

export function onRunTest() {
  logger.info('on run test ->>> ', socket);
}
