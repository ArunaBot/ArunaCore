import IConnection from './interfaces/iconnection';
import IMessage from './interfaces/imessage';
import Parser from './utils/parser';
import * as wss from 'ws';

class Socket {
  private ws: wss.Server;
  private parser = new Parser({});
  private connections: IConnection[] = [];

  constructor(port: number) {
    this.ws = new wss.Server({ port: port });
    this.ws.on('connection', this.onConnection);
  }

  private onConnection(ws: wss.WebSocket):void {
    ws.on('message', this.onMessage);
  }

  private onMessage(message: wss.MessageEvent):void {
    const data: IMessage = this.parser.parse(message.data.toString());

    const conectionsFounded = this.connections.find((connection: IConnection) => connection.id === data.from);

    if (!conectionsFounded || data.args[0] === 'register') {
      this.registerConnection(message.target, data);
      return;
    }

    console.log(data);
  }

  private registerConnection(ws: wss.WebSocket, info: IMessage): void {
    const conectionsFounded = this.connections.find((connection: IConnection) => connection.id === info.from);
    if (!conectionsFounded) {
      // Register connection
    } else if (info.args[0] === 'register') {
      // Send a message to the client informing that the connection with this id is already registered
    }
  }

  private rawSend (connection: wss.WebSocket, data: any):void {
    connection.send(data);
  }

  private send(connection: wss.WebSocket, data: any):void {
    connection.send(data);
  }

  public finishWebSocket():void {
    this.connections.forEach((connection: IConnection) => {
      this.close(connection.connection, 255, 'ArunaCore is shutting down');
    });
  }

  private close(connection: wss.WebSocket, code?: number, reason?: string):void {
    connection.close(code || 0, reason);
  }
}

export default Socket;
