import {OS_TYPE} from "os-enums";
import { execute } from '../utils/execute';
import logger from "../utils/logger";
import path from "path";
import { productName } from "../package.json";

export const getHomePath = async (os: OS_TYPE): Promise<string> => {
  let command: string = 'echo %USERPROFILE%';
  let path: string = '';

  if (os === "LINUX" || os === 'MAC') {
    command = 'echo ~'
  }

  await execute(command).then(res => {
    path = res;
  }).catch(logger.error);

  return path;
}

export const PROJECT_PATH = path.resolve('C:/Program Files', productName);

