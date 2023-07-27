import { IMessage, WebSocketParser } from 'arunacore-api';
import { ConnectionManager } from './connectionManager';
import { IConnection } from '../../interfaces';
import { Socket } from '../socket';
import * as wss from 'ws';

export class MessageHandler {
  private connectionManager: ConnectionManager;
  private parser: WebSocketParser;
  private masterKey: string|null;
  private socket: Socket;

  constructor(mainSocket: Socket) {
    this.socket = mainSocket;
    this.parser = mainSocket.getWSParser();
    this.masterKey = mainSocket.getMasterKey();
    this.connectionManager = mainSocket.getConnectionManager();

    mainSocket.getLogger().info('Message handler initialized!');
  }

  public async onMessage(message: wss.MessageEvent, connection: wss.WebSocket): Promise<void> {
    const data: IMessage|null = this.parser.parse(message.data.toString());

    if (data == null) return;

    const connectionFounded = this.connectionManager.getConnection(data.from);

    if (!connectionFounded || data.args[0] === 'register') {
      this.connectionManager.registerConnection(message.target, data);
      return;
    }

    if (connectionFounded && connectionFounded.isSecure) {
      if (connectionFounded.secureKey !== data.secureKey) {
        connection.close(1000, this.parser.formatToString('arunacore', '401', ['unauthorized'], data.from));
        return;
      }
    }

    if (connectionFounded && data.args[0] === 'unregister') {
      this.connectionManager.unregisterConnection(connectionFounded);
      return;
    }

    if (await this.defaultCommandExecutor(connectionFounded, data)) return;

    const toConnectionsFounded = this.connectionManager.getConnection(data.to!);

    if (!toConnectionsFounded) {
      this.socket.send(message.target, 'arunacore', '404', ['target', 'not-found'], data.from); // Message example: :arunacore 404 :target not-found [from-id]
      return;
    }

    // ping the sender to check if it's alive
    if (!await this.connectionManager.ping(toConnectionsFounded)) {
      this.socket.send(message.target, 'arunacore', '404', ['target', 'not-found'], data.from);
      return;
    }

    if (toConnectionsFounded.isSecure && toConnectionsFounded.secureKey !== data.targetKey) {
      this.socket.send(message.target, 'arunacore', '401', ['unauthorized'], data.from);
      return;
    }

    this.socket.emit('message', data);

    if (data.secureKey) delete data.secureKey;
    if (data.targetKey) delete data.targetKey;

    toConnectionsFounded.connection.send(this.parser.toString(data));
  }

  private async defaultCommandExecutor(connection: IConnection, message: IMessage): Promise<boolean> {
    var forceTrue = false;

    if (!message.to || (this.masterKey && message.args.includes(this.masterKey))) forceTrue = true;

    switch (message.command) {
      // Get the list of all current connections alive ids
      case '015':
        if (!this.masterKey) {
          this.socket.send(connection.connection, 'arunacore', '503', ['service', 'unavaliable'], message.from);
          return Promise.resolve(true);
        }
        if ((message.args.length !== 1) || (this.masterKey !== message.args[0])) {
          this.socket.send(connection.connection, 'arunacore', '401', ['unauthorized'], message.from);
          return Promise.resolve(true);
        }
        var ids: string[] = this.connectionManager.getAliveConnections().map((connection) => connection.id);
        this.socket.send(connection.connection, 'arunacore', '015', ids, message.from);
        return Promise.resolve(true);
      case '000':
        return Promise.resolve(true);
      default:
        return Promise.resolve(forceTrue);
    }
  }
}
