import path from 'path';
import fs from 'fs';
import {OS_TYPE} from 'os-enums';
import generateKeys from '../utils/generatePubKey';
import {getHomePath, PROJECT_PATH} from '../enums';
import {pullEnvVarsFromVMTools, setEnvVars} from "../utils/setEnvVars";
import {isFileExist, writeFile} from "../utils/files";
import {IAppEnvironments} from "env-enums";
import {productName} from "../package.json";

export default async function initApp<O extends OS_TYPE>(os: O): Promise<IAppEnvironments> {
  const HOME = await getHomePath(os);
  const ENV_VARS = await setEnvVars(os);
  const appName = productName;
  const {privateKeyPath, publicKeyPath, keysDirPath} = await generateKeys(PROJECT_PATH);

  const DYNAMIC_ENV_VARS = await pullEnvVarsFromVMTools();

  const ALL_ENVS = {
    HOME,
    APP_NAME: appName,
    LOGS: {
      LINUX: path.resolve(PROJECT_PATH, 'logs'),
      MAC: path.resolve(PROJECT_PATH, 'logs'),
      WINDOWS: path.resolve(PROJECT_PATH, 'logs'),
    },
    PROJECT_PATH: PROJECT_PATH,
    AUTH_KEYS_PATH: {
      ROOT: keysDirPath,
      PRIVATE: privateKeyPath,
      PUBLIC: publicKeyPath,
    },
    SCRIPTS_EXE_FOLDER: path.resolve(PROJECT_PATH, 'execScripts'),
    ENV_FILE_PATH: path.resolve(PROJECT_PATH, 'agentEnvsLocal.txt'),
    SESSION_PATH: path.resolve(PROJECT_PATH, 'agentSessions.txt'),
    ...ENV_VARS,
    ...DYNAMIC_ENV_VARS,
  };

  await isFileExist(ALL_ENVS.ENV_FILE_PATH).catch(() => writeFile(`${ALL_ENVS.ENV_FILE_PATH}`, JSON.stringify(ALL_ENVS)));
  await isFileExist(ALL_ENVS.SESSION_PATH).catch(() => writeFile(`${ALL_ENVS.SESSION_PATH}`, ''));
  !fs.existsSync(ALL_ENVS.SCRIPTS_EXE_FOLDER) && fs.mkdirSync(ALL_ENVS.SCRIPTS_EXE_FOLDER);
  !fs.existsSync(PROJECT_PATH) && fs.mkdirSync(PROJECT_PATH);

  return ALL_ENVS;
}
