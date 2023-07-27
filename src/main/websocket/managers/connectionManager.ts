import { IMessage, WebSocketParser } from 'arunacore-api';
import { ConnectionStructure } from '../structures';
import { Logger } from '@promisepending/logger.js';
import { Socket } from '../socket';
import * as wss from 'ws';

export class ConnectionManager {
  private timeouts: Map<wss.WebSocket, ReturnType<typeof setTimeout>> = new Map();
  private connections: Map<string, ConnectionStructure> = new Map();
  private parser: WebSocketParser;
  private pingLoopTimeout: any;
  private requireAuth: boolean;
  private logger: Logger;
  private socket: Socket;

  constructor(socket: Socket) {
    this.socket = socket;
    this.logger = socket.getLogger();
    this.parser = socket.getWSParser();
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
    const connectionFounded = this.connections.get(info.from);
    if (!connectionFounded) {
      // Register connection
      if (info.args.length < 2) {
        ws.send(this.parser.formatToString('arunacore', '400', ['invalid', 'register', 'message']));
      } else {
        // TODO: Create a good way to check if the client is using a supported api version

        // Let's check the secure mode
        var secureMode = false;
        var secureKey = '';
        if (info.secureKey) {
          secureMode = true;
          secureKey = info.secureKey;
        }

        if (this.requireAuth && !secureMode) {
          ws.close(1000, this.parser.formatToString('arunacore', '401', ['unauthorized'], info.from)); // closes the connection with the user, Message example: :arunacore 501 :unauthorized [from-id]
          return;
        }

        const connection = new ConnectionStructure({
          id: info.from,
          type: info.type,
          isAlive: true,
          connection: ws,
          apiVersion: info.args[3],
          isSecure: secureMode,
          secureKey,
          isSharded: false, // TODO: Implement sharding
        }, this.logger, this.parser);

        this.connections.set(info.from, connection); // Add connection to list
        ws.send(this.parser.formatToString('arunacore', '000', ['register-success'], info.from)); // sends a message to the user letting them know it's registered, Message example: :arunacore 000 :register-success

        this.logger.info(`Connection ${info.from} registered!`);
        if (this.timeouts.has(ws)) clearTimeout(this.timeouts.get(ws));
      }
    } else if (info.args[0] === 'register') {
      if (!await this.ping(connectionFounded)) {
        this.logger.warn(`Connection ${info.from} appears to be dead and a new connection is trying to register with the same id, closing the old connection...`);
        this.registerConnection(ws, info);
        return;
      }
      // Send a message to the client informing that the connection with this id is already registered
      ws.send(this.parser.formatToString('arunacore', '403', ['invalid', 'register', 'id-already-registered'], info.from)); // Message example: :arunacore 401 :invalid register id-already-registered [from-id]
      this.logger.warn(`ID ${info.from} is already registered but a new connection is trying to register with the same id. This probably means that the client is trying to connect twice.`);
    }
  }

  public async unregisterConnection(connection: ConnectionStructure): Promise<void> {
    if (await this.ping(connection)) {
      connection.send(this.parser.format('arunacore', '000', ['unregister-success', ', ', 'goodbye!'], connection.getID()));
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
