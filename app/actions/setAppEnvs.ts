import {AgentSession} from "../utils/session";
import {IAppEnvironments} from "env-enums";
import {readFile} from "../utils/files";

export default async function setAppEnvs(envs: IAppEnvironments) {
  AgentSession.setEnvs(envs);
  await readFile(envs.AUTH_KEYS_PATH.CERT).then((publicKey: string) =>
    AgentSession.setEnvs({
      publicKey: publicKey,
    })
  ).catch(() => 'No certificate file found');
}
