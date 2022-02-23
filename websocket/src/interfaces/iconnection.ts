import * as WS from 'ws';

export interface IConnection {
  id: string,
  type?: string,
  connection: WS;
}
