/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { IMessage, IWebsocketOptions } from '../interfaces';
import { Logger } from '@promisepending/logger.js';
import { WebSocketParser, utils } from '../';
import { EventEmitter } from 'events';
import ws from 'ws';

export class ArunaClient extends EventEmitter {
  private WSParser: WebSocketParser;
  private secureMode: boolean;
  private shardMode: boolean;
  private secureKey: string | null = null;
  private ws: ws.WebSocket | null = null;
  private isRegistered = false;
  private logger: Logger;
  private host: string;
  private port: number;
  private id: string;
  private finishTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(options: IWebsocketOptions) {
    super();
    this.id = options.id ?? 'client';
    this.host = options.host ?? 'localhost';
    this.port = options.port ?? 3000;
    this.WSParser = new WebSocketParser();
    this.logger = options.logger ?? new Logger({ prefix: 'WSClient' });

    this.secureMode = options.secureMode ?? false;

    if (this.secureMode) {
      if (options.secureKey == null) throw new Error('Secure key is required for secure mode!');
      this.secureKey = options.secureKey;
    }

    this.shardMode = options.shardMode ?? false;

    if (this.shardMode && !this.secureMode) throw new Error('Shard mode requires secure mode!');
  }

  public async connect(secureKey?: string): Promise<void> {
    if (secureKey) {
      this.secureKey = secureKey;
      this.secureMode = true;
    }

    this.ws = new ws(`ws://${this.host}:${this.port}`);
    return new Promise((resolve, reject) => {
      this.ws!.on('message', (message) => { this.onMessage(message.toString()); });

      this.ws!.on('close', (code, reason) => { this.emit('close', code, reason); });

      this.ws!.on('error', (err) => { this.emit('error', err); });

      this.ws!.on('open', () => {
        this.logger.debug('Connected to server!');
        this.logger.debug('Registering client...');
        this.register();
        resolve();
      });

      this.ws!.on('error', (err) => {
        this.logger.error(err);
        reject(err);
      });
    });
  }

  public async send(command: string, args: string[], to?: string, targetKey?: string, type?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState !== ws.OPEN) return reject(new Error('Connection is not open!'));
      if (this.secureMode && this.secureKey == null) return reject(new Error('Secure key is required for secure mode!'));
      if (this.secureMode) {
        args.splice(0, 0, 'key:' + this.secureKey);
        if (targetKey && targetKey !== '' && targetKey !== this.secureKey) args.splice(1, 0, 'targetKey:' + targetKey);
      }
      const message = this.WSParser.format(this.id, command, args, to, type);
      this.ws.send(this.WSParser.toString(message), (err) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          this.logger.debug(`Sent message: ${this.WSParser.toString(message)}`);
          resolve();
        }
      });
    });
  }

  private onMessage(message: string): void {
    const parsedMessage = this.WSParser.parse(message);

    if (parsedMessage == null) return;

    switch (parsedMessage.command) {
      case '000':
        if (parsedMessage.args[0] === 'register-success') {
          this.isRegistered = true;
          this.logger.debug('Client Registered!');
          this.emit('ready');
        } else if (parsedMessage.args[0] === 'unregister-success') {
          this.isRegistered = false;
          this.logger.debug('Client Unregistered!');
          this.emit('finish');
        } else {
          this.emit('message', parsedMessage);
        }
        break;
      case '401':
        this.emit('unauthorized', parsedMessage);
        break;
      case '403':
        this.id = this.id + utils.randomString(5);
        this.register();
        break;
      default:
        this.emit('message', parsedMessage);
        this.emit(parsedMessage.command, parsedMessage);
        break;
    }
  }

  private register(): void {
    if (this.isRegistered) return;
    this.send('000', ['register', '1.0.0-ALPHA.x', '1.0.0-ALPHA.x', process.env.npm_package_version ?? '']); // [register, minimunCoreVersion, maximumCoreVersion, currentApiVersion]
  }

  public async ping(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState !== ws.OPEN) return reject(new Error('Connection is not open!'));
      this.ws.ping((err: any) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  public getWSParser(): WebSocketParser {
    return this.WSParser;
  }

  public getID(): string {
    return this.id;
  }

  public async finish(): Promise<void> {
    return new Promise(async (resolve) => {
      if (this.ws?.readyState !== ws.OPEN) return resolve();

      this.once('finish', () => {
        if (this.finishTimeout) {
          clearTimeout(this.finishTimeout);
          this.finishTimeout = null;
        }
        resolve();
      });

      this.finishTimeout = setTimeout(() => {
        this.ws?.close(1000);
        resolve();
      }, 5000);
      await this.send('000', ['unregister']);
    });
  }
}

export interface ArunaClient {
  getWSParser(): WebSocketParser;
  getID(): string;
  ping(): Promise<boolean>;
  finish(): Promise<void>;
  on(event: 'ready', listener: () => void): this;
  on(event: 'finish', listener: () => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
  on(event: 'message', listener: (message: IMessage) => void): this;
  on(event: 'close', listener: (code: number, reason: string) => void): this;
  on(event: string, listener: (...args: any[]) => void): this;
}
