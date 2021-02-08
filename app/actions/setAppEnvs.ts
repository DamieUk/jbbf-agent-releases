import {AgentSession} from "../utils/session";
import {IAppEnvironments} from "env-enums";
import {readFile} from "../utils/files";

export default async function setAppEnvs(envs: IAppEnvironments) {
  AgentSession.setEnvs(envs);
  await readFile(envs.AUTH_KEYS_PATH.CERT).then((publicKey: string) => {
    AgentSession.setEnvs({
      publicKey: publicKey
        .replace('-----BEGIN CERTIFICATE-----', '')
        .replace('-----END CERTIFICATE-----', '')
        .replace(/(\r\n|\n|\r)/gm, ''),
    })
  }).catch(() => 'some error');
  await readFile(envs.AUTH_KEYS_PATH.PRIVATE).then((privateKey: string) => {
    AgentSession.setEnvs({
      privateKey: privateKey
        .replace('-----BEGIN RSA PRIVATE KEY-----\n', '')
        .replace('-----END RSA PRIVATE KEY-----\n', '')
        .replace(/(\r\n|\n|\r)/gm, '')
    })
  }).catch(() => 'some error');
}
