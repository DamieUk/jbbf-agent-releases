import {App} from 'electron';
import path from 'path';
import {OS_TYPE} from 'os-enums';
import generateKeys from '../utils/generatePubKey';
import {getHomePath} from '../enums';
import {pullEnvVarsFromVMTools, setEnvVars} from "../utils/setEnvVars";
import {isFileExist, writeFile} from "../utils/files";
import {IAppEnvironments} from "env-enums";

export default async function initApp<A extends App, O extends OS_TYPE>(app: A, os: O): Promise<IAppEnvironments> {
  const HOME = await getHomePath(os);
  const ENV_VARS = await setEnvVars(os);
  const appName = app.getName();
  const projectPath = path.dirname(app.getPath(`exe`));
  const {privateKeyPath, publicKeyPath, keysDirPath} = await generateKeys(projectPath);

  const DYNAMIC_ENV_VARS = await pullEnvVarsFromVMTools();

  const ALL_ENVS = {
    HOME,
    APP_NAME: appName,
    LOGS: {
      LINUX: `${HOME}/.config/${appName}/logs`,
      MAC: `${HOME}/Library/Logs/${appName}`,
      WINDOWS: `${HOME}/AppData/Roaming/${appName}/logs`,
    },
    PROJECT_PATH: projectPath,
    AUTH_KEYS_PATH: {
      ROOT: keysDirPath,
      PRIVATE: privateKeyPath,
      PUBLIC: publicKeyPath,
    },
    ENV_FILE_PATH: `${projectPath}/agentEnvsLocal.txt`,
    SESSION_PATH: `${projectPath}/agentSessions.txt`,
    ...ENV_VARS,
    ...DYNAMIC_ENV_VARS,
  };

  await isFileExist(ALL_ENVS.ENV_FILE_PATH).catch(() => writeFile(`${ALL_ENVS.ENV_FILE_PATH}`, JSON.stringify(ALL_ENVS)));
  await isFileExist(ALL_ENVS.SESSION_PATH).catch(() => writeFile(`${ALL_ENVS.SESSION_PATH}`, ''));

  return ALL_ENVS;
}
