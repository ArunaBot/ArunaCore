import { ConnectionManager, MessageHandler } from './managers';
import { ConnectionStructure } from './structures';
import { Logger } from '@promisepending/logger.js';
import { ISocketOptions } from '../interfaces';
import { IMessage } from '../../../api/src';
import { IncomingMessage } from 'http';
import { EventEmitter } from 'events';
import { autoLogEnd } from '../utils';
import { HTTPServer } from '../http';
import semver from 'semver';
import Stream from 'stream';
import ws from 'ws';

export class Socket extends EventEmitter {
  private connectionManager: ConnectionManager;
  private messageHandler: MessageHandler;
  private isAutoLogEndEnable: boolean;
  private masterKey: string | null;
  private httpServer: HTTPServer;
  private requireAuth: boolean;
  private logger: Logger;
  // @ts-expect-error -- ws server is broken with esm
  private ws: ws.Server;

  constructor(port: number, logger: Logger, options?: ISocketOptions) {
    super();
    this.logger = logger;

    this.httpServer = new HTTPServer(logger);
    this.httpServer.listen(port);

    this.httpServer.on('upgrade', this.webSocketUpgrade.bind(this));
    
    // @ts-expect-error -- ws server is broken with esm
    this.ws = new ws.Server({
      noServer: true,
      maxPayload: 512 * 1024,
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

    if (options && options.autoLogEnd) {
      autoLogEnd.activate(this);
      this.isAutoLogEndEnable = true;
    } else {
      this.isAutoLogEndEnable = false;
    }

    this.requireAuth = options?.requireAuth ?? false;
    this.masterKey = options?.masterKey ?? null;

    this.connectionManager = new ConnectionManager(this);
    this.messageHandler = new MessageHandler(this);

    this.connectionManager.pingLoop();

    this.emit('ready');
  }

  private async webSocketUpgrade(req: IncomingMessage, socket: Stream.Duplex, head: Buffer): Promise<void> {
    const apiVersion = req.headers['arunacore-api-version'] as string | undefined;
    const appId = req.headers['client-id'] as string | undefined;
    const userToken = req.headers['authorization'];

    if (!apiVersion || !appId) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    // FIXME: Define supported versions properly
    if (!semver.satisfies(apiVersion, '>= 1.0.0-BETA.4 < 2.0.0')) {
      socket.write('HTTP/1.1 412 Precondition Failed\r\n\r\n');
      socket.destroy();
      return;
    }
    
    if (this.requireAuth && !userToken) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const locateConnection = this.connectionManager.getConnection(appId);

    if (locateConnection && (await this.connectionManager.ping(locateConnection))) {
      socket.write('HTTP/1.1 409 Conflict\r\n\r\n');
      socket.destroy();
      return;
    }

    // @ts-expect-error -- ws server is broken with esm
    this.ws.handleUpgrade(req, socket, head, (client, _req) => {
      this.connectionManager.onConnection(client);
      const connection = new ConnectionStructure({
        id: appId,
        isAlive: true,
        connection: client,
        apiVersion: apiVersion,
        isSecure: !!userToken,
        secureKey: userToken,
        isSharded: false, // TODO: Implement sharding
      }, this.logger);
      this.connectionManager.addConnection(connection);
    });
  }

  private rawSend(connection: WebSocket, data: any):void {
    connection.send(data);
  }

  /**
   * Sends a message to a client
   * @param connection the websocket connection
   * @param from id of the sender
   * @param command the command
   * @param args arguments of the command
   * @param to optional id of the receiver
   * @param type optional client type
   * @deprecated Use connection.send() instead
   */
  public send(connection: WebSocket, message: IMessage): void {
    try {
      connection.send(JSON.stringify(message));
    } catch (e) {
      this.logger.warn('An error occurred while trying to send a message to a client:', e);
      this.logger.warn('The above error probably occurred because of lack of data or invalid data');
    }
  }

  public async finishWebSocket(): Promise<void> {
    this.logger.warn('Finishing Connections...');
    this.connectionManager.shutdown();

    this.logger.warn('Stopping WebSocket Server...');
    this.ws.close();

    this.logger.warn('Stopping HTTP Server...');
    this.httpServer.close();

    this.logger.info('WebSocket Stopped! Goodbye O/');

    if (this.isAutoLogEndEnable) autoLogEnd.deactivate();

    return Promise.resolve();
  }

  public getMasterKey(): string | null {
    return this.masterKey;
  }

  public getLogger(): Logger {
    return this.logger;
  }

  public isAuthRequired(): boolean {
    return this.requireAuth;
  }

  public getMessageHandler(): MessageHandler {
    return this.messageHandler;
  }

  public getConnectionManager(): ConnectionManager {
    return this.connectionManager;
  }
}
