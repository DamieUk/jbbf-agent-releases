// @ts-ignore
import { createSimpleLogger } from 'simple-node-logger';
import { PROJECT_LOGS_MAIN_PATH } from '../enums';

const logger = createSimpleLogger(PROJECT_LOGS_MAIN_PATH)
logger.info(`Logs are placed in "${PROJECT_LOGS_MAIN_PATH}"`);

export default logger;
