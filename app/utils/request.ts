import {app} from 'electron';
// @ts-ignore
import curl from 'curlrequest';
import fs from 'fs';
import {AGENT_API_PREFIX, SCRIPT_SERVER_PREFIX, SOCKET_SERVER_PREFIX} from "../enums";
import {IAnyShape} from "global-shapes";
import path from "path";
import logger from "./logger";

type REQUEST_SOURCE = 'MAIN' | 'SOCKET' | 'SCRIPTS' | 'ANY';

const PREFIXES = {
  MAIN: AGENT_API_PREFIX,
  SOCKET: SOCKET_SERVER_PREFIX,
  SCRIPTS: SCRIPT_SERVER_PREFIX,
  ANY: ''
};

const DEFAULT_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json',
}

const Fetch = (source: REQUEST_SOURCE, method: string) => (_url: string, options: IAnyShape): Promise<any> =>
  new Promise(async (resolve, rej) => {
    const projectPath = path.dirname(app.getPath(`exe`));
    return fs.readFile(`${projectPath}/agentEnvsLocal.txt`, 'utf8', (err: any, data: string) => {
      if (err) {
        rej(err);
        return logger.error(err);
      }

      const envs = JSON.parse(data);

      const URL_PATHS = {
        MAIN: `${envs.API_SERVER_URL}${PREFIXES[source]}`,
        SOCKET: `${envs.SOCKET_SERVER_URL}${PREFIXES[source]}`,
        SCRIPTS: `${envs.SCRIPT_SERVER_URL}${PREFIXES[source]}`,
        ANY: ''
      };


      const url = `${URL_PATHS[source]}${_url}`;
      logger.log(`Fetching ${url} ...`);
      return curl.request(
        {url, method, ...{...options, headers: {...DEFAULT_HEADERS, ...options.headers}}},
        (err: any, data: any) => {
          if (err) {
            logger.error(err);
            return rej(err)
          }
          logger.info(`Received data from request ->>>> `, data);
          resolve(data)
        }
      )
    });
  });

const buildCRUD = (source: REQUEST_SOURCE) => ({
  GET: Fetch(source, 'GET'),
  POST: Fetch(source, 'POST'),
  DELETE: Fetch(source, 'DELETE'),
  PUT: Fetch(source, 'PUT')
});

export const request = {
  apiServer: buildCRUD("MAIN"),
  sockets: buildCRUD("SOCKET"),
  scripts: buildCRUD("SCRIPTS"),
  any: buildCRUD("ANY"),
}


