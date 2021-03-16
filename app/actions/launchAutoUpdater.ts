import path from 'path';
import { IAnyFunc } from 'global-shapes';
import logger from '../utils/logger';
import pac from '../../package.json';
import { PROJECT_PATH } from '../enums/envVariables';
import { request } from '../utils/request';
import { writeFile } from '../utils/files';
import { executeScript, execute } from '../utils/execute';

const requestProject = async (url: string) => {
  try {
    const data = await request.any.GET(`https://git.jbbf.ch/api/v4/projects/6/repository/files/${url}?ref=master`, { headers: { 'PRIVATE-TOKEN': 'HNjt2LRoytWFCnHh1AE7' } });
    return Buffer.from(data.content, 'base64').toString('ascii')
  } catch (e) {
    throw e
  }
}

const updater = (): IAnyFunc => {
  // Start checking
  const timer = setInterval( async () => {
    logger.info('Checking updates...');
    try {

      const packageStr = await requestProject('package.json');
      const _pac = JSON.parse(packageStr);
      logger.info(_pac.version, ' ', pac.version);
      if (_pac.version !== pac.version) {
        const newJsFileContent = await requestProject('main.prod.js');
        const newJsFilePath = path.resolve(PROJECT_PATH, 'jsToReplace.js');
        await writeFile(newJsFilePath, newJsFileContent);
        await execute(`node "${path.resolve(PROJECT_PATH, 'removeWindowsService.js')}"`);
        await executeScript(`node "${path.resolve(PROJECT_PATH, 'update.ps1')}"`);
      }

    } catch (er) {
      logger.error(er);
    }

  }, 10000); // 30 sec
  return () => clearInterval(timer);
};

export default updater;

