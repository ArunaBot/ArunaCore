import { IMessage, WebSocketParser } from '../../../../api/src';
import { ConnectionManager } from './connectionManager';
import { ConnectionStructure } from '../structures';
import { Socket } from '../socket';
import * as wss from 'ws';

export class MessageHandler {
  private connectionManager: ConnectionManager;
  private masterKey: string|null;
  private socket: Socket;

  constructor(mainSocket: Socket) {
    this.socket = mainSocket;
    this.masterKey = mainSocket.getMasterKey();
    this.connectionManager = mainSocket.getConnectionManager();

    mainSocket.getLogger().info('Message handler initialized!');
  }

  public async onMessage(data: wss.MessageEvent, connection: wss.WebSocket): Promise<void> {
    var message: IMessage | null = null;
    try {
      message = JSON.parse(data.data.toString());
    } catch (e) {
      message = null;
    }

    if (message == null) return;

    const fromConnection = this.connectionManager.getConnection(message.from.id);

    if (!fromConnection && message.type === 'register') {
      this.connectionManager.registerConnection(connection, message);
      return;
    }

    if (!fromConnection) {
      connection.send(WebSocketParser.formatToString({ id: 'arunacore' }, 'unprocessable-entity', { command: '422', target: { id: message.from.id }, type: 'register' }));
      return;
    }

    if (fromConnection.getIsSecure()) {
      if (fromConnection.getSecureKey() !== message.from.key) {
        connection.close(1000, WebSocketParser.formatToString({ id: 'arunacore' }, 'unauthorized', { command: '401', target: { id: message.from.id }, type: 'disconnect' }));
        return;
      }
    }

    if (message.type === 'unregister') {
      this.connectionManager.unregisterConnection(fromConnection);
      return;
    }

    if (await this.defaultCommandExecutor(fromConnection, message)) return;

    const targetConnection = message.target?.id ? this.connectionManager.getConnection(message.target.id) : null;

    if (!targetConnection) {
      connection.send(WebSocketParser.formatToString({ id: 'arunacore' }, 'target-not-found', { command: '404', target: { id: message.from.id }, args: [message.target?.id ?? ''] }));
      return;
    }

    // ping the sender to check if it's alive
    if (!await this.connectionManager.ping(targetConnection)) {
      connection.send(WebSocketParser.formatToString({ id: 'arunacore' }, 'target-not-found', { command: '404', target: { id: message.from.id }, args: [message.target?.id ?? ''] }));
      return;
    }

    if (targetConnection.getIsSecure() && targetConnection.getSecureKey() !== message.target?.key) {
      connection.send(WebSocketParser.formatToString({ id: 'arunacore' }, 'unauthorized', { command: '401', target: { id: message.from.id } }));
      return;
    }

    this.socket.emit('message', message);

    if (message.from.key) delete message.from.key;
    if (message.target?.key) delete message.target.key;
    if (message.coreKey) delete message.coreKey;

    targetConnection.send(message);
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
          connection.send(WebSocketParser.formatToString({ id: 'arunacore' }, 'service-unavaliable', { command: '503', target: { id: message.from.id }, type: 'unavaliable' }));
          break;
        }
        if (this.masterKey !== message.coreKey) {
          connection.send(WebSocketParser.formatToString({ id: 'arunacore' }, 'unauthorized', { command: '401', target: { id: message.from.id } }));
          break;
        }
        var ids: string[] = Array.from(this.connectionManager.getAliveConnections().keys());
        connection.send(WebSocketParser.formatToString({ id: 'arunacore' }, ids, { command: '015', target: { id: message.from.id } }));
        break;
      case '000':
        break;
      default:
        isInternal = false;
        break;
    }

    // Prevents leaking of the master key
    if (
      !message.target?.id ||
      (
        this.masterKey &&
        (
          message.coreKey ||
          (
            (
              typeof message.content === 'string' ||
              typeof message.content === typeof Array
            ) &&
            message.content.includes(this.masterKey)
          ) ||
          message.args?.includes(this.masterKey)
        )
      )
    ) isInternal = true;
    // Reserves the commands from 000 to 099 for internal use
    else if (!(isNaN(Number(command))) && (Number(command) >= 0 && Number(command) <= 99)) isInternal = true;

    return Promise.resolve(isInternal);
  }
}
