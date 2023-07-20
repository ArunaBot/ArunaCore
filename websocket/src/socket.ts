/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { ConnectionManager, MessageHandler } from './managers';
import { IMessage, WebSocketParser } from 'arunacore-api';
import { Logger } from '@promisepending/logger.js';
import { HTTPServer } from '@arunabot/core-http';
import { ISocketOptions } from './interfaces';
import { EventEmitter } from 'events';
import { autoLogEnd } from './utils';
import * as wss from 'ws';

export class Socket extends EventEmitter {
  private ws: wss.Server;
  private logger: Logger;
  private isAutoLogEndEnable: boolean;
  private requireAuth: boolean;
  private timeouts: any[] = [];
  private parser = new WebSocketParser();
  private httpServer: HTTPServer;
  private masterKey: string | null;
  private connectionManager: ConnectionManager;
  private messageHandler: MessageHandler;

  constructor(port: number, logger: Logger, options?: ISocketOptions) {
    super();
    this.httpServer = new HTTPServer();
    this.httpServer.enableUpgradeRequired();
    this.httpServer.listen(port);
    this.logger = logger;
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

    this.ws.on('connection', (ws) => { this.connectionManager.onConnection(ws); }); // When a connection is made, call the onConnection function

    this.connectionManager.pingLoop();

    this.emit('ready');
  }

  private rawSend (connection: wss.WebSocket, data: any):void {
    connection.send(data);
  }

  // This is used to prevent the re-use of the same code
  public send(connection: wss.WebSocket, from: string, command: string, args: string[], to?: string, type?: string):void {
    try {
      const message = this.parser.formatToString(from, command, args, to, type); // Formats the message
      connection.send(message); // Sends the message
    } catch (e) {
      this.logger.warn('An error occurred while trying to send a message to a client:', e);
      this.logger.warn('The above error probably occurred because of lack of data or invalid data');
    }
  }

  public async finishWebSocket(): Promise<void> {
    this.logger.warn('Finishing Connections...');
    this.connectionManager.shutdown();

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

  public getMasterKey(): string | null {
    return this.masterKey;
  }

  public getWSParser(): WebSocketParser {
    return this.parser;
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

export interface Socket {
  getWSParser(): WebSocketParser;
  getLogger(): Logger;
  finishWebSocket(): Promise<void>;
  send(connection: wss.WebSocket, from: string, command: string, args: string[], to?: string, type?: string): void;
  on(event: 'message', listener: (message: IMessage) => void): this;
  on(event: 'ready', listener: () => void): this;
}
