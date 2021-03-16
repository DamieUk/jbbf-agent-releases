import { IAnyShape, ISession } from 'global-shapes';
import { IAppEnvironments } from 'env-enums';

type Envs = IAppEnvironments | IAnyShape;

class AgentSessionInstance {
  public session: ISession = {
    accessToken: '',
    refreshToken: '',
    expiresIn: 1000000000,
  };

  public envs: Envs = {};

  public setSession = (session: ISession) => {
    this.session = {
      ...this.session,
      ...session,
    };
  };

  public getSession = () => {
    return this.session;
  };

  public setEnvs = (envs: Envs) => {
    this.envs = {
      ...this.envs,
      ...envs,
    };
  };

  public getEnvs = (): Envs => {
    return this.envs;
  };
}

export const AgentSession = new AgentSessionInstance();
