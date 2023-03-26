import { IMessage, Logger, WebSocketParser } from 'arunacore-api';
import { IConnection, ISocketOptions } from './interfaces';
import { HTTPServer } from '@arunabot/core-http';
import { EventEmitter } from 'events';
import { autoLogEnd } from './utils';
import * as wss from 'ws';

export class Socket extends EventEmitter {
  private ws: wss.Server;
  private logger: Logger;
  private isAutoLogEndEnable: boolean;
  private requireAuth: boolean;
  private timeouts: any[] = [];
  private pingLoopTimeout: any;
  private parser = new WebSocketParser({});
  private connections: IConnection[] = [];
  private httpServer: HTTPServer;

  constructor(port: number, logger: Logger, options?: ISocketOptions) {
    super();
    this.httpServer = new HTTPServer();
    this.httpServer.registerRoute('/healthCheck', 'get', (req: any, res: any) => {
      res.write('OK');
      res.statusCode = 200;
      return res.end();
    });
    this.httpServer.enableUpgradeRequired();
    this.httpServer.listen(port);
    this.ws = new wss.Server({
      server: this.httpServer.getServer()!,
      perMessageDeflate: {
        zlibDeflateOptions: {
          chunkSize: (4 * 1024),
          memLevel: 7,
          level: 3,
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024,
        },
        clientNoContextTakeover: false,
        serverNoContextTakeover: false,
        threshold: (4 * 1024),
      },
    }); // Creates a new websocket server
    this.ws.on('connection', (ws) => { this.onConnection(ws); }); // When a connection is made, call the onConnection function
    this.logger = logger;
    this.pingLoop();

    if (options && options.autoLogEnd) {
      autoLogEnd.activate(this);
      this.isAutoLogEndEnable = true;
    } else {
      this.isAutoLogEndEnable = false;
    }

    this.requireAuth = options?.requireAuth ?? false;
  }

  private onConnection(ws: wss.WebSocket):void {
    ws.on('message', (message) => this.onMessage({ data: message, target: ws, type: '' }, ws));
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

  private async onMessage(message: wss.MessageEvent, connection: wss.WebSocket): Promise<void> {
    const data: IMessage|null = this.parser.parse(message.data.toString());

    if (data == null) return;

    const connectionsFounded = this.connections.find((conn: IConnection) => conn.id === data.from);

    if (!connectionsFounded || data.args[0] === 'register') {
      this.registerConnection(message.target, data);
      return;
    }

    if (connectionsFounded && connectionsFounded.isSecure) {
      if (connectionsFounded.secureKey !== data.secureKey) {
        connection.close(1000, this.parser.toString(this.parser.format('arunacore', '401', ['unauthorized'], data.from)));
        return;
      }
    }

    if (connectionsFounded && data.args[0] === 'unregister') {
      this.unregisterConnection(connectionsFounded);
      return;
    }

    if (!data.to) return;

    const toConnectionsFounded = this.connections.find((connection: IConnection) => connection.id === data.to);

    if (!toConnectionsFounded) {
      this.send(message.target, 'arunacore', '404', ['target', 'not-found'], data.from); // Message example: :arunacore 404 :target not-found [from-id]
      return;
    }

    // ping the sender to check if it's alive
    if (!await this.ping(toConnectionsFounded)) {
      this.send(message.target, 'arunacore', '404', ['target', 'not-found'], data.from);
      return;
    }

    if (toConnectionsFounded.isSecure && toConnectionsFounded.secureKey !== data.targetKey) {
      this.send(message.target, 'arunacore', '401', ['unauthorized'], data.from);
      return;
    }

    this.emit('message', data);

    if (data.secureKey) delete data.secureKey;
    if (data.targetKey) delete data.targetKey;

    toConnectionsFounded.connection.send(this.parser.toString(data));
  }

  /**
   * Register a new connection on the server
   * @param ws the websocket connection
   * @param info the original message
   */
  private async registerConnection(ws: wss.WebSocket, info: IMessage): Promise<void> {
    const connectionsFounded = this.connections.find((connection: IConnection) => connection.id === info.from);
    if (!connectionsFounded) {
      // Register connection
      if (info.args.length < 2) {
        ws.send(this.parser.toString(this.parser.format('arunacore', '400', ['invalid', 'register', 'message'])));
      } else {
        // TODO: Enable this when we have a stable version
        /*
        // Let's check if core version matches the api necessities
        const coreMinimumVersion: string = info.args[1]; // Minimum version
        const coreMaximumVersion: string = info.args[2]; // Maximum version

        if (!semver.satisfies(process.env.npm_package_version || '', `>=${coreMinimumVersion} <=${coreMaximumVersion}`)) {
          ws.close(1000, this.parser.toString(this.parser.format('arunacore', '505', ['invalid', 'version'], info.from))); // closes the connection with the user, Message example: :arunacore 505 :invalid version [from-id]
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
          ws.close(1000, this.parser.toString(this.parser.format('arunacore', '401', ['unauthorized'], info.from))); // closes the connection with the user, Message example: :arunacore 501 :unauthorized [from-id]
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
        ws.send(this.parser.toString(this.parser.format('arunacore', '000', ['register-success'], info.from))); // sends a message to the user letting them know it's registered, Message example: :arunacore 000 :register-success
      }
    } else if (info.args[0] === 'register') {
      if (!await this.ping(connectionsFounded)) {
        this.registerConnection(ws, info);
        return;
      }
      // Send a message to the client informing that the connection with this id is already registered
      ws.send(this.parser.toString(this.parser.format('arunacore', '403', ['invalid', 'register', 'id-already-registered'], info.from))); // Message example: :arunacore 401 :invalid register id-already-registered [from-id]
    }
  }

  private unregisterConnection(connection: IConnection): void {
    const index = this.connections.indexOf(connection);
    if (index !== -1) {
      this.connections.splice(index, 1);
    }

    connection.connection.send(this.parser.toString(this.parser.format('arunacore', '000', ['unregister-success', ', ', 'goodbye!'], connection.id)));

    setTimeout(async () => {
      if (await this.ping(connection)) {
        connection.connection.close(1000);
      }
    }, 5000);
  }

  private rawSend (connection: wss.WebSocket, data: any):void {
    connection.send(data);
  }

  // This is used to prevent the re-use of the same code with gambiarra
  public send(connection: wss.WebSocket, ...data: any):void {
    try {
      const message = this.parser.toString(this.parser.format(data[0], data[1], data[2], data[3], data[4])); // Formats the message
      connection.send(message); // Sends the message
    } catch (e) {
      this.logger.warn('An error occurred while trying to send a message to a client:', e);
      this.logger.warn('The above error probably occurred because of lack of data or invalid data');
    }
  }

  public async finishWebSocket(): Promise<void> {
    this.logger.warn('Finishing Connections...');
    this.connections.forEach((connection: IConnection) => {
      this.close(connection.connection, 'ArunaCore is shutting down', 1012);
    });
    this.logger.warn('Stopping Ping Loop...');
    clearTimeout(this.pingLoopTimeout);
    this.logger.warn('Stopping Timeouts...');
    this.timeouts.forEach((timeoutO: any) => {
      clearTimeout(timeoutO.timeout);
    });
    this.logger.warn('Stopping WebSocket Server...');
    this.ws.close();
    this.logger.warn('Stopping HTTP Server...');
    this.httpServer.close();
    this.logger.info('WebSocket Stopped! Goodbye O/');
    if (this.isAutoLogEndEnable) autoLogEnd.deactivate();
    return Promise.resolve();
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

  public getWSParser(): WebSocketParser {
    return this.parser;
  }

  /**
   * Call the function massPing every 30 seconds to check if the connections are alive
   */
  private pingLoop():void {
    this.pingLoopTimeout = setInterval(() => this.massPing(), 30000);
  }

  /**
   * Sends a ping message to all the connections
   */
  private massPing(): void {
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

  private close(connection: wss.WebSocket, reason?: string, code = 1000):void {
    connection.close(code, reason);
  }
}

export interface Socket {
  getWSParser(): WebSocketParser;
  finishWebSocket(): Promise<void>;
  send(connection: wss.WebSocket, ...data: any): void;
  on(event: 'message', listener: (message: IMessage) => void): this;
}
