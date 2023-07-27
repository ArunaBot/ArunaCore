import { IMessage, WebSocketParser } from 'arunacore-api';
import { ConnectionManager } from './connectionManager';
import { ConnectionStructure } from '../structures';
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

    if (connectionFounded && connectionFounded.getIsSecure()) {
      if (connectionFounded.getSecureKey() !== data.secureKey) {
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

    if (toConnectionsFounded.getIsSecure() && toConnectionsFounded.getSecureKey() !== data.targetKey) {
      this.socket.send(message.target, 'arunacore', '401', ['unauthorized'], data.from);
      return;
    }

    this.socket.emit('message', data);

    if (data.secureKey) delete data.secureKey;
    if (data.targetKey) delete data.targetKey;

    toConnectionsFounded.send(data);
  }

  /**
   * Default command executor
   * @param connection ConnectionStructure
   * @param message IMessage
   * @returns Promise<boolean> isInternal, if true, the message will not be sent to the target
   * @private
   */
  private async defaultCommandExecutor(connection: ConnectionStructure, message: IMessage): Promise<boolean> {
    const command = message.command;
    var isInternal = true;

    switch (command) {
      // Get the list of all current connections alive ids
      case '015':
        if (!this.masterKey) {
          connection.send(this.parser.format('arunacore', '503', ['service', 'unavaliable'], message.from));
          break;
        }
        if ((message.args.length !== 1) || (this.masterKey !== message.args[0])) {
          connection.send(this.parser.format('arunacore', '401', ['unauthorized'], message.from));
          break;
        }
        var ids: string[] = Array.from(this.connectionManager.getAliveConnections().keys());
        connection.send(this.parser.format('arunacore', '015', ids, message.from));
        break;
      case '000':
        break;
      default:
        isInternal = false;
        break;
    }

    // Prevents leaking of the master key
    if (!message.to || (this.masterKey && message.args.includes(this.masterKey))) isInternal = true;
    // Reserves the commands from 000 to 099 for internal use
    else if (!(isNaN(Number(command))) && (Number(command) >= 0 && Number(command) <= 99)) isInternal = true;

    return Promise.resolve(isInternal);
  }
}
