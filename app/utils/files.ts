import fs from "fs";
import logger from "./logger";

export const readFile = (path: string): Promise<string> => new Promise((res, rej) => {
  fs.readFile(path, 'utf8', (err, data) => {
    if (err) {
      rej(err);
      return logger.error(`Could read file "${path}"`);
    }
    res(data);
  })
});

export const writeFile = (path: string, data: any): Promise<typeof  data> => new Promise((res, rej) => {
  fs.writeFile(path, data, (err) => {
    if (err) {
      rej(err);
      return logger.error(`Could not create file "${path}"`);
    }
    res(data);
    logger.info(`File "${path}" has been successfully created`);
  })
});

export const isFileExist = (path: string): Promise<boolean> => new Promise((res, rej) => {
  fs.access(path, undefined, (err) => {
    if (!err) res(true);
    if (err) {
      rej(err)
      logger.error(`File "${path}" not found`)
    }
  });
});
