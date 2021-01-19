import {IAnyShape, ISession} from "global-shapes";

class AgentSessionInstance {
  public session: ISession = {
    accessToken: '',
    refreshToken: '',
    expiresIn: 1000000000
  };

  public envs: IAnyShape = {};

  public setSession = (session: ISession) => {
    this.session = {
      ...this.session,
      ...session
    }
  }

  public getSession = () => {
    return this.session;
  }

  public setEnvs = (envs: IAnyShape) => {
    this.envs = {
      ...this.envs,
      ...envs
    }
  }

  public getEnvs = () => {
    return this.envs;
  }
}

export const AgentSession = new AgentSessionInstance();
