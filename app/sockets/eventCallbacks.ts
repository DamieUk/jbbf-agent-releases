// import cp from 'child_process';
import logger from '../utils/logger';

export function onConnect(url: string) {
  return () => logger.info(
    `Websocket: Connect ->>>> Successfully connected to websocket server ${url}!`
  );
}

export function onRunTest() {
  logger.info('on run test ->>> ');
}
