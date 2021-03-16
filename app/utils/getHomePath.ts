import { OS_TYPE } from 'os-enums';
import { execute } from './execute';
import logger from './logger';

export const getHomePath = async (os: OS_TYPE): Promise<string> => {
  let command: string = 'echo %USERPROFILE%';
  let path: string = '';

  if (os === 'LINUX' || os === 'MAC') {
    command = 'echo ~';
  }

  await execute(command)
    .then((res) => {
      path = res;
    })
    .catch(logger.error);

  return path;
};

export default getHomePath;
