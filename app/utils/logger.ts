// @ts-ignore
import { createSimpleLogger } from 'simple-node-logger';
import { PROJECT_PATH } from '../enums';
import path from 'path';

const LOGS_PATH = (path.resolve(PROJECT_PATH, 'logs', 'main.log'));

const logger = createSimpleLogger(LOGS_PATH)
logger.info(`Logs are placed in "${LOGS_PATH}"`);


export default logger;
