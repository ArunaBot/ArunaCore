import * as WS from 'ws';

export interface IConnection {
  id: string,
  type?: string,
  isAlive: boolean,
  apiVersion: string,
  connection: WS.WebSocket;
}
