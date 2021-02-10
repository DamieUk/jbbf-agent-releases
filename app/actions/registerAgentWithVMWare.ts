import {IAppEnvironments} from "env-enums";
import {request} from "../utils/request";
import {AgentSession} from "../utils/session";
import logger from "../utils/logger";
import {isFileExist, readFile, writeFile} from "../utils/files";
import {ISession} from "global-shapes";

const registerApp = async (envs: IAppEnvironments) => {
  const isSessionCreated = await isFileExist(envs.SESSION_PATH)
    .then(() =>
      readFile(envs.SESSION_PATH).then(session => !!session)
    );

  if (isSessionCreated) {
    await readFile(envs.SESSION_PATH).then(session => {
      logger.info('Session is found. VM is already authorized')
      return AgentSession.setSession(JSON.parse(session))
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
      AgentSession.setSession(res);
      await writeFile(envs.SESSION_PATH, JSON.stringify(res));
      logger.info('Session is recorded');
      return res;
    }).catch(() => logger.info('VM is already authorized'))
  }
  return;
}

export default registerApp;
