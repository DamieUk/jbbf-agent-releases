// @ts-ignore
import axios from 'axios';
import {
  AGENT_API_PREFIX,
  SCRIPT_SERVER_PREFIX,
  SOCKET_SERVER_PREFIX,
} from '../enums';
import { IAnyShape } from 'global-shapes';
import logger from './logger';
import { AgentSession } from './session';

type REQUEST_SOURCE = 'MAIN' | 'SOCKET' | 'SCRIPTS' | 'ANY';

const PREFIXES = {
  MAIN: AGENT_API_PREFIX,
  SOCKET: SOCKET_SERVER_PREFIX,
  SCRIPTS: SCRIPT_SERVER_PREFIX,
  ANY: '',
};

export const DEFAULT_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json',
};

const Fetch = (source: REQUEST_SOURCE, method: string) => (
  _url: string,
  _options?: IAnyShape
): Promise<any> =>
  new Promise((resolve, reject) => {
    const envs = AgentSession.getEnvs();
    const options = _options || {};

    const URL_PATHS = {
      MAIN: `${envs.API_SERVER_URL}${PREFIXES[source]}`,
      SOCKET: `${envs.SOCKET_SERVER_URL}${PREFIXES[source]}`,
      SCRIPTS: `${envs.SCRIPT_SERVER_URL}${PREFIXES[source]}`,
      ANY: '',
    };

    const url = `${URL_PATHS[source]}${_url}`;
    logger.info(
      `Fetching ${url} ... ${
        options.data ? `data -> ${JSON.stringify(options.data)}` : ''
      }`
    );
    const headers = { ...DEFAULT_HEADERS, ...options.headers };

    const onError = (err: string) => {
      reject(err);
      logger.info(`Error on requesting ${method} ${url}`);
    };

    switch (method) {
      case 'GET':
        return axios
          .get(url, { headers, data: options.data })
          .then((res) => resolve(res.data))
          .catch(onError);
      case 'PUT':
        return axios
          .put(url, options.data, { headers })
          .then((res) => resolve(res.data))
          .catch(onError);
      case 'DELETE':
        return axios
          .delete(url, { headers, data: options.data })
          .then((res) => resolve(res.data))
          .catch(onError);
      case 'POST':
        return axios
          .post(url, options.data, { headers })
          .then((res) => resolve(res.data))
          .catch(onError);
      default:
        return reject('Undefined method');
    }
  });

const buildCRUD = (source: REQUEST_SOURCE) => ({
  GET: Fetch(source, 'GET'),
  POST: Fetch(source, 'POST'),
  DELETE: Fetch(source, 'DELETE'),
  PUT: Fetch(source, 'PUT'),
});

export const request = {
  apiServer: buildCRUD('MAIN'),
  sockets: buildCRUD('SOCKET'),
  scripts: buildCRUD('SCRIPTS'),
  any: buildCRUD('ANY'),
};
