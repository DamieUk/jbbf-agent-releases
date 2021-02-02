import {IAppEnvironments} from "env-enums";
import {request} from "../utils/request";
import {AgentSession} from "../utils/session";
import {isFileExist, readFile, writeFile} from "../utils/files";
import {ISession} from "global-shapes";
import {session} from "electron";

class RefreshSession {
  timer: any = undefined;

  requestNewSession = () => {
    if (AgentSession.getSession().accessToken) {
      return request.apiServer.POST(
        '/agent-auth/refresh',
        {data: {refreshToken: AgentSession.getSession().refreshToken}}
      ).then((session: ISession) => {
        AgentSession.setSession(session);
        return writeFile(AgentSession.getEnvs().SESSION_PATH, JSON.stringify(session));
      })
    }
    return null;
  }

  startSession = () => {
    this.timer = setInterval(this.requestNewSession, 1000 * 60 * 14); // update every 14 minutes
  }

  stopSession = () => {
    clearInterval(this.timer);
  }
}

export const refreshSession = new RefreshSession();

const registerApp = async (envs: IAppEnvironments) => {
  const isSessionCreated = await isFileExist(envs.SESSION_PATH);

  if (isSessionCreated) {
    await readFile(envs.SESSION_PATH).then(session => {
      return AgentSession.setSession(JSON.parse(session))
    })
  }

  if (envs.AGENT_TOKEN && !isSessionCreated) {
    return request.apiServer.PUT('/agent-auth/verify', {
      data: {
        token: envs.AGENT_TOKEN,
        publicKey: AgentSession.getEnvs().publicKey
      }
    }).then(async (res: ISession) => {
      AgentSession.setSession(res);
      await writeFile(envs.SESSION_PATH, JSON.stringify(res));
      return res;
    })
  }
  return;
}

export default registerApp;
