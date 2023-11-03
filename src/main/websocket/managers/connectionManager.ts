import { IMessage, WebSocketParser } from '../../../../api/src';
import { ConnectionStructure } from '../structures';
import { Logger } from '@promisepending/logger.js';
import { Socket } from '../socket';
import * as wss from 'ws';

export class ConnectionManager {
  private timeouts: Map<wss.WebSocket, ReturnType<typeof setTimeout>> = new Map();
  private connections: Map<string, ConnectionStructure> = new Map();
  private pingLoopTimeout: any;
  private requireAuth: boolean;
  private logger: Logger;
  private socket: Socket;

  constructor(socket: Socket) {
    this.socket = socket;
    this.logger = socket.getLogger();
    this.requireAuth = socket.isAuthRequired();

    this.logger.info('Connection manager initialized!');
  }

  public onConnection(ws: wss.WebSocket):void {
    ws.on('message', (message) => this.socket.getMessageHandler().onMessage({ data: message, target: ws, type: '' }, ws));
    this.timeouts.set(ws,
      setTimeout(() => {
        const found = Array.from(this.connections.entries()).find(([, connection]) => connection.getConnection() === ws);
        if (!found) ws.close(1000, 'Authentication timeout');
      }, 15000),
    );
  }

  /**
   * Register a new connection on the server
   * @param ws the websocket connection
   * @param info the original message
   */
  public async registerConnection(ws: wss.WebSocket, info: IMessage): Promise<void> {
    const connectionFounded = this.connections.get(info.from.id);
    if (!connectionFounded) {
      // Register connection
      if (info.type !== 'register') {
        ws.send(WebSocketParser.formatToString({ id: 'arunacore' }, 'invalid register message', { command: '400', type: 'register' }));
      } else {
        // Let's check the secure mode
        var secureMode = false;
        var secureKey;
        if (info.from.key) {
          secureMode = true;
          secureKey = info.from.key;
        }

        if (this.requireAuth && !secureMode) {
          ws.close(1000, WebSocketParser.formatToString({ id: 'arunacore' }, 'unauthorized', { command: '401', target: { id: info.from.id }, type: 'disconnect' }));
          return;
        }

        const connection = new ConnectionStructure({
          id: info.from.id,
          isAlive: true,
          connection: ws,
          apiVersion: '', // TODO: Create a good way to check if the client is using a supported api version
          isSecure: secureMode,
          secureKey,
          isSharded: false, // TODO: Implement sharding
        }, this.logger);

        this.connections.set(info.from.id, connection); // Add connection to list
        ws.send(WebSocketParser.formatToString({ id: 'arunacore' }, 'register-success', { command: '000', target: { id: info.from.id }, type: 'register' }));

        this.logger.info(`Connection ${info.from.id} registered!`);
        if (this.timeouts.has(ws)) clearTimeout(this.timeouts.get(ws));
      }
    } else if (info.type === 'register') {
      if (!(await this.ping(connectionFounded))) {
        this.logger.warn(`Connection ${info.from.id} appears to be dead and a new connection is trying to register with the same id, old connection was destroyed!`);
        this.registerConnection(ws, info);
        return;
      }
      // Send a message to the client informing that the connection with this id is already registered
      ws.send(WebSocketParser.formatToString({ id: 'arunacore' }, 'id-already-registered', { command: '403', target: { id: info.from.id }, type: 'register' }));
      this.logger.warn(`ID ${info.from.id} is already registered but a new connection is trying to register with the same id. Probably the client is trying to connect twice.`);
    }
  }

  // public async unregisterConnection(connection: ConnectionStructure, message: IMessage): Promise<void> {
  public async unregisterConnection(connection: ConnectionStructure): Promise<void> {
    if (await this.ping(connection)) {
      connection.send(WebSocketParser.formatToString({ id: 'arunacore' }, 'unregister-success', { command: '000', args: ['goodbye! O/'], target: { id: connection.getID() }, type: 'register' }));
      connection.close(1000);
    }

    this.connections.delete(connection.getID());
  }

  /**
   * Send a ping for a specific connection and remove it from the list if it's dead
   * @param connection the connection to ping
   * @returns {Promise<boolean>} a promise with a boolean value if the connection is alive [True] for alive and [False] for terminated
   */
  public async ping(connection: ConnectionStructure): Promise<boolean> {
    const pingResult = await connection.ping();

    if (!pingResult) {
      this.logger.warn(`Connection ${connection.getID()} appears to be dead, removing it from the list...`);
      this.connections.delete(connection.getID());
    }

    return pingResult;
  }

  /**
   * Call the function massPing every 30 seconds to check if the connections are alive
   */
  public pingLoop(): void {
    if (this.pingLoopTimeout) return;
    this.pingLoopTimeout = setInterval(() => this.massPing(), 30000);
  }

  /**
   * Sends a ping message to all the connections
   */
  public massPing(): void {
    this.connections.forEach((connection) => {
      this.ping(connection);
    });
  }

  public shutdown(): void {
    this.connections.forEach((connection) => {
      connection.close(1012, 'ArunaCore is Shutting Down');
      this.connections.delete(connection.getID());
    });
    this.logger.warn('Stopping ping loop...');
    clearInterval(this.pingLoopTimeout);
    this.pingLoopTimeout = null;
  }

  /**
   * @param connection
   * @param reason
   * @param code
   * @deprecated Use connection.close() instead
   */
  public close(connection: ConnectionStructure, reason?: string, code = 1000): void {
    connection.close(code, reason);
  }

  public getConnections(): Map<string, ConnectionStructure> {
    return this.connections;
  }

  public getAliveConnections(): Map<string, ConnectionStructure> {
    return new Map(Array.from(this.connections).filter(([, connection]) => connection.getIsAlive()));
  }

  public getConnection(id: string): ConnectionStructure | undefined {
    return this.connections.get(id);
  }
}
