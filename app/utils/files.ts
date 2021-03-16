import fs, { WriteFileOptions } from 'fs';
import logger from './logger';

export const readFile = (path: string): Promise<string> =>
  new Promise((res, rej) => {
    if (!path) {
      rej('No file specified');
      return;
    }
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        rej(err);
        return logger.error(`Could not read file "${path}"`);
      }
      res(data);
    });
  });

export const writeFile = (
  path: string,
  data: any,
  options?: WriteFileOptions
): Promise<typeof data> =>
  new Promise((res, rej) => {
    try {
      fs.writeFile(path, data, options || { encoding: 'ascii' }, (err) => {
        if (err) {
          rej(err);
          throw err;
        }
        res(data);
        logger.info(`File "${path}" has been successfully created`);
      });
    } catch (e) {
      return logger.error(`Could not create file "${path}"`, e);
    }
  });

export const mkDir = (path: string): Promise<boolean> =>
  new Promise((res) => {
    return isFileExist(path)
      .then(() => {
        logger.info(`Folder "${path}" already exist`);
        res(false);
      })
      .catch(() => {
        fs.mkdirSync(path, { recursive: true });
        res(true);
        logger.info(`Folder "${path}" has been created`);
      });
  });

export const isFileExist = (path: string): Promise<boolean> =>
  new Promise((res, rej) => {
    fs.access(path, undefined, (err) => {
      if (!err) res(true);
      if (err) {
        rej(err);
        logger.error(`File "${path}" not found`);
      }
    });
  });
