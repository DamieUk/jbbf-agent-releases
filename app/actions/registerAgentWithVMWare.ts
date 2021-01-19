import {IAppEnvironments} from "env-enums";
import {request} from "../utils/request";
import {AgentSession} from "../utils/session";
import {writeFile} from "../utils/files";
import {ISession} from "global-shapes";

const registerApp = async (envs: IAppEnvironments) => {
  if (envs.AGENT_TOKEN) {
    return await request.apiServer.PUT('/agent-auth/verify', {
      data: {
        token: envs.AGENT_TOKEN,
        publicKey: AgentSession.getEnvs().publicKey
      }
    }).then((res: ISession) => {
      AgentSession.setSession(res);
      writeFile(envs.SESSION_PATH, JSON.stringify(res));
      return res;
    })
  }
  return;
}

export default registerApp;
