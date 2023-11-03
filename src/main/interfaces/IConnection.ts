import * as WS from 'ws';

export interface IConnection {
  id: string,
  isAlive: boolean,
  isSecure: boolean,
  secureKey?: string,
  isSharded: boolean,
  shardID?: number,
  shardRootID?: string,
  apiVersion: string,
  connection: WS.WebSocket;
}
