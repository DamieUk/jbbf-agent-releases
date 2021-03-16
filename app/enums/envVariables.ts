import path from "path";
import { CurrentOS } from "./os";
import { productName } from "../package.json";

const ABSOLUTE_PATHS = {
  WINDOWS: {
    project: 'C:/Program Files',
    programData: 'C:/ProgramData'
  },
  MAC: {
    project: '/Agent/Base',
    programData: '/Agent/ProgramData'
  },
  LINUX: {
    project: '/Agent/Base',
    programData: '/Agent/ProgramData'
  }
}

export const PROJECT_PATH = path.resolve(ABSOLUTE_PATHS[CurrentOS].project, productName);
export const PROGRAM_DATA_PATH = path.resolve(ABSOLUTE_PATHS[CurrentOS].programData, productName);
export const PROJECT_LOGS_PATH = path.resolve(PROGRAM_DATA_PATH, 'logs');
export const PROJECT_LOGS_MAIN_PATH = path.resolve(PROJECT_LOGS_PATH, 'main.log');
export const PROJECT_KEYS_PATH = path.resolve(PROGRAM_DATA_PATH, 'SyncKeys');

