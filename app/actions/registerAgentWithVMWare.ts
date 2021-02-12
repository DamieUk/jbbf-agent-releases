import {IAppEnvironments} from "env-enums";
import {request} from "../utils/request";
import {AgentSession} from "../utils/session";
import logger from "../utils/logger";
import socket from "../sockets/socket";
import {isFileExist, readFile, writeFile} from "../utils/files";
import {ISession} from "global-shapes";

const registerApp = async (envs: IAppEnvironments) => {
  const isSessionCreated = await isFileExist(envs.SESSION_PATH)
    .then(() =>
      readFile(envs.SESSION_PATH).then(session => !!session)
    );

  if (isSessionCreated) {
    await readFile(envs.SESSION_PATH).then(session => {
      logger.info('Session is found. VM is already authorized');
      const ses = JSON.parse(session);
      socket.initSocket(envs, ses.accessToken)
      return AgentSession.setSession(ses)
    })
  }

  if (envs.AGENT_TOKEN && !isSessionCreated) {
    return request.apiServer.PUT('/agent-auth/verify', {
      data: {
        token: envs.AGENT_TOKEN,
        certificatePemBase64: Buffer.from(
          // @ts-ignore
          AgentSession.getEnvs().certificate
        ).toString('base64')
      }
    }).then(async (res: ISession) => {
      socket.initSocket(envs, res.accessToken)
      AgentSession.setSession(res);
      await writeFile(envs.SESSION_PATH, JSON.stringify(res));
      logger.info('Session is recorded');
      return res;
    }).catch((er) => logger.info('VM is already authorized of has error: ', er))
  }
  return;
}

export default registerApp;
