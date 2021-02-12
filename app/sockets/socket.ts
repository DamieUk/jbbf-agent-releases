import {IAppEnvironments} from "env-enums";
// @ts-ignore
import io from "socket.io-client";
import {SocketEvents} from "./constants";
import * as evenCallbacks from "./eventCallbacks";
import logger from "../utils/logger";

class SocketInstance {
  public socket = undefined;

  public initSocket = (envs: IAppEnvironments, token: string) => {
    if (envs.SOCKET_SERVER_URL) {
      logger.info('Connecting to websocket server...');
      const socketUrl = `${envs.SOCKET_SERVER_URL}?accessToken=${token}`;
      this.socket = io(socketUrl, {
        transports: ['websocket'],
        rejectUnauthorized: false,
        secure: false,
      });
      if (this.socket) {
        // @ts-ignore
        this.socket.on(SocketEvents.connect, evenCallbacks.onConnect(envs));
        // @ts-ignore
        this.socket.on(SocketEvents.connectError, logger.error);
        // @ts-ignore
        this.socket.on(SocketEvents.runCommand, evenCallbacks.onRunCommand(envs));
      }
      return this.socket;
    } else {
      logger.info('Websocket server is not defined...');
      return null
    }
  }

  public getInstance = () => this.socket
}

const socket = new SocketInstance();

export default socket;
