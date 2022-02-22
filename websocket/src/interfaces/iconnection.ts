import * as WS from 'ws';

interface IConnection {
  id: string,
  type?: string,
  connection: WS;
}

export default IConnection;
