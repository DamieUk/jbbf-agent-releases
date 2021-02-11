import {AgentSession} from "../utils/session";
import {IAppEnvironments} from "env-enums";
import {readFile} from "../utils/files";

export default async function setAppEnvs(envs: IAppEnvironments) {
  AgentSession.setEnvs(envs);
  await readFile(envs.AUTH_KEYS_PATH.CERT).then((certificate: string) =>
    AgentSession.setEnvs({
      certificate,
    })
  ).catch(() => 'No certificate file found');
}
