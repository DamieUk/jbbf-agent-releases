import path from "path";
import { productName } from "../package.json";

export const PROJECT_PATH = path.resolve('C:/Program Files', productName);
export const PROGRAM_DATA_PATH = path.resolve('C:/ProgramData', productName);
export const PROJECT_LOGS_PATH = path.resolve(PROGRAM_DATA_PATH, 'logs');
export const PROJECT_LOGS_MAIN_PATH = path.resolve(PROJECT_LOGS_PATH, 'main.log');
export const PROJECT_KEYS_PATH = path.resolve(PROGRAM_DATA_PATH, 'SyncKeys');

