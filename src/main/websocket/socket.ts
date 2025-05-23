import { ConnectionManager, MessageHandler } from './managers';
import { Logger } from '@promisepending/logger.js';
import { ISocketOptions } from '../interfaces';
import { IMessage } from '../../../api/src';
import { EventEmitter } from 'events';
import { autoLogEnd } from '../utils';
import { HTTPServer } from '../http';
import ws from 'ws';

export class Socket extends EventEmitter {
  private connectionManager: ConnectionManager;
  private messageHandler: MessageHandler;
  private isAutoLogEndEnable: boolean;
  private masterKey: string | null;
  private httpServer: HTTPServer;
  private requireAuth: boolean;
  // @ts-expect-error Broken WS package types, works in runtime
  private ws: ws.Server;
  private logger: Logger;

  constructor(port: number, logger: Logger, options?: ISocketOptions) {
    super();
    this.httpServer = new HTTPServer(logger);
    this.httpServer.enableUpgradeRequired();
    this.httpServer.listen(port);
    this.logger = logger;
    // @ts-expect-error Broken WS package types, works in runtime
    this.ws = new ws.Server({
      server: this.httpServer.getServer()!,
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

    // @ts-expect-error Broken WS package types, works in runtime
    this.ws.on('connection', (ws) => { this.connectionManager.onConnection(ws); }); // When a connection is made, call the onConnection function

    this.connectionManager.pingLoop();

    this.emit('ready');
  }

  private rawSend (connection: WebSocket, data: any):void {
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
