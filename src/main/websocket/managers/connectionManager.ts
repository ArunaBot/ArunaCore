import { IMessage, WebSocketParser } from 'arunacore-api';
import { Logger } from '@promisepending/logger.js';
import { IConnection } from '../../interfaces';
import { Socket } from '../socket';
import * as wss from 'ws';

export class ConnectionManager {
  private connections: IConnection[] = [];
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
    setTimeout(() => {
      var found = false;
      this.connections.forEach((connection: IConnection) => {
        if (connection.connection === ws) found = true;
      });
      if (!found) ws.close(1000, 'Authentication timeout');
    }, 15000);
    // When the client responds to the ping in time (within the timeout), we state that the client is alive else we close the connection
    ws.on('pong', (): void => {
      this.connections.forEach((connection: IConnection) => {
        if (connection.connection === ws) {
          connection.isAlive = true;
        }
      });
    });
  }

  /**
   * Register a new connection on the server
   * @param ws the websocket connection
   * @param info the original message
   */
  public async registerConnection(ws: wss.WebSocket, info: IMessage): Promise<void> {
    const connectionFounded = this.connections.find((connection: IConnection) => connection.id === info.from);
    if (!connectionFounded) {
      // Register connection
      if (info.args.length < 2) {
        ws.send(this.parser.formatToString('arunacore', '400', ['invalid', 'register', 'message']));
      } else {
        // TODO: Enable this when we have a stable version
        /*
        // Let's check if core version matches the api necessities
        const coreMinimumVersion: string = info.args[1]; // Minimum version
        const coreMaximumVersion: string = info.args[2]; // Maximum version

        if (!semver.satisfies(process.env.npm_package_version || '', `>=${coreMinimumVersion} <=${coreMaximumVersion}`)) {
          ws.close(1000, this.parser.formatToString('arunacore', '505', ['invalid', 'version'], info.from)); // closes the connection with the user, Message example: :arunacore 505 :invalid version [from-id]
          return;
        }
        */

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

        const connection: IConnection = {
          id: info.from,
          type: info.type,
          isAlive: true,
          connection: ws,
          apiVersion: info.args[3],
          isSecure: secureMode,
          secureKey,
          isSharded: false, // TODO: Implement sharding
        };

        this.connections.push(connection); // Add connection to list
        ws.send(this.parser.formatToString('arunacore', '000', ['register-success'], info.from)); // sends a message to the user letting them know it's registered, Message example: :arunacore 000 :register-success
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

  public unregisterConnection(connection: IConnection): void {
    const index = this.connections.indexOf(connection);
    if (index !== -1) {
      this.connections.splice(index, 1);
    }

    connection.connection.send(this.parser.formatToString('arunacore', '000', ['unregister-success', ', ', 'goodbye!'], connection.id));

    setTimeout(async () => {
      if (await this.ping(connection)) {
        connection.connection.close(1000);
      }
    }, 5000);
  }

  /**
   * Send a ping for a specific connection
   * @param connection the connection to ping
   * @returns {Promise<boolean>} a promise with a boolean value if the connection is alive [True] for alive and [False] for terminated
   */
  public async ping(connection: IConnection): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!connection.isAlive) {
          connection.connection.terminate();
          this.connections = this.connections.filter((connectionChecker: IConnection) => connectionChecker.id !== connection.id);
          resolve(false);
        } else resolve(true);
      }, 5000);
      connection.connection.ping();
    });
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
    this.connections.forEach((connection: IConnection) => {
      connection.connection.ping();
      connection.isAlive = false;
      setTimeout(() => {
        if (!connection.isAlive) {
          connection.connection.terminate();
          this.connections = this.connections.filter((connectionChecker: IConnection) => connectionChecker.id !== connection.id);
        }
      }, 5000);
    });
  }

  public shutdown(): void {
    this.connections.forEach((connection: IConnection) => {
      this.close(connection.connection, 'ArunaCore is Shutting Down', 1012);
    });
    this.logger.warn('Stopping ping loop...');
    clearInterval(this.pingLoopTimeout);
    this.pingLoopTimeout = null;
  }

  public close(connection: wss.WebSocket, reason?: string, code = 1000):void {
    connection.close(code, reason);
  }

  public getConnections(): IConnection[] {
    return this.connections;
  }

  public getAliveConnections(): IConnection[] {
    return this.connections.filter((connection: IConnection) => connection.isAlive);
  }

  public getConnection(id: string): IConnection|undefined {
    return this.connections.find((connection: IConnection) => connection.id === id);
  }
}
