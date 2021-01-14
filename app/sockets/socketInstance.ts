import io from 'socket.io-client';

const socketClient = io('ws://jbbf-dev-socket.jbbf.ch', {
  transports: ['websocket'],
  rejectUnauthorized: false,
  secure: false,
});

export default socketClient;
