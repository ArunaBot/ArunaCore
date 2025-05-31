import { IMessage, IWebsocketOptions } from '../interfaces';
import { Logger } from '@promisepending/logger.js';
import { WebSocketParser, utils } from '../';
import { EventEmitter } from 'events';
import ws from 'ws';

/**
 * Main class for the api client
 * @class ArunaClient
 * @extends {EventEmitter}
 * @example
 * const { ArunaClient } = require('aruna-api');
 * const client = new ArunaClient({
 *  host: 'localhost',
 *  port: 3000,
 *  secureMode: false,
 *  shardMode: false,
 *  secureKey: null,
 *  logger: null,
 *  id: 'client'
 * });
 * client.on('ready', () => {
 *  console.log('Client is ready!');
 * });
 * client.on('message', (message) => {
 *  console.log(message);
 * });
 * client.connect(); // optional: secureKey
 */
export class ArunaClient extends EventEmitter {
  private secureMode: boolean;
  private shardMode: boolean;
  private secureKey: string | null = null;
  private ws: ws | null = null;
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
    this.logger = options.logger ?? new Logger({ prefix: 'WSClient' });

    this.secureMode = options.secureMode ?? false;

    if (this.secureMode) {
      if (options.secureKey == null) throw new Error('Secure key is required for secure mode!');
      this.secureKey = options.secureKey;
    }

    this.shardMode = options.shardMode ?? false;

    if (this.shardMode && !this.secureMode) throw new Error('Shard mode requires secure mode!');
  }

  /**
   * Connects to the ArunaCore server
   * @param {string?} [secureKey] Secure key for secure mode
   * @returns {Promise<void>}
   */
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

  /**
   * Sends a message to the ArunaCore server.
   * 
   * @param {any} content - Content of the message, can be a string or a serializable object.
   * @param {Object} options - Options for the message.
   * @param {string} [options.type] - Type of the client or message.
   * @param {string} [options.command] - Command code for the message.
   * @param {{ id: string, key?: string }} [options.target] - Target of the message (id and optional key).
   * @param {string[]} [options.args] - Arguments of the message.
   * @returns {Promise<void>} Resolves when the message is sent.
   * 
   * @example
   * await client.send('100', {
   *   args: ['Hello World!'],
   *   target: { id: 'server', key: 'serverKey' },
   *   type: 'client',
   *   command: 'someCommand'
   * });
   */
  public async send(content: any, { type, command, target, args }: { type?: string, command?: string, target?: { id: string, key?: string }, args?: string[] }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState !== ws.OPEN) return reject(new Error('Connection is not open!'));

      const finalFrom: { id: string, key?: string } = {
        id: this.id,
      };

      if (this.secureMode && this.secureKey == null) return reject(new Error('Secure key is required for secure mode!'));
      else if (this.secureKey) Object.assign(finalFrom, { key: this.secureKey });

      this.ws.send(WebSocketParser.formatToString(finalFrom, content, { type, command, target, args }), (err) => {
        if (err) {
          this.logger.error(err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Called when a message is received from the ArunaCore server
   * Responsable for parsing the message and emitting the events
   * @param {string} message Message received
   * @returns {void}
   * @private
   */
  private onMessage(message: string): void {
    var parsedMessage: IMessage | null = null;
    try {
      parsedMessage = JSON.parse(message);
    } catch {
      parsedMessage = null;
    }

    if (!parsedMessage) return;

    switch (parsedMessage.command) {
      case '000':
        if (parsedMessage.content === 'register-success') {
          this.isRegistered = true;
          this.logger.debug('Client Registered!');
          this.emit('ready');
        } else if (parsedMessage.content === 'unregister-success') {
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
        if (parsedMessage.type !== 'register') return;
        this.id = this.id + utils.randomString(5);
        this.register();
        break;
      default:
        this.emit('message', parsedMessage);
        if (parsedMessage.command) this.emit(parsedMessage.command, parsedMessage);
        break;
    }
  }

  /**
   * Registers the client in the ArunaCore server
   * @returns {void}
   * @private
   */
  private register(): void {
    if (this.isRegistered) return;
    this.send('request-register', { command: '000', type: 'register' });
  }

  /**
   * Pings the ArunaCore server
   * @returns {Promise<boolean>}
   * @example
   * client.ping().then(() => {
   *  console.log('Pong!');
   * });
   */
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

  /**
   * Returns the client id
   * @returns {string}
   */
  public getID(): string {
    return this.id;
  }

  /**
   * Indicates if the client is registered in the ArunaCore server
   * @returns {boolean}
   */
  public getIsRegistered(): boolean {
    return this.isRegistered;
  }

  /**
   * Closes the connection to the ArunaCore server
   * @returns {Promise<void>}
   * @example
   * client.finish().then(() => {
   *  console.log('Connection closed!');
   * });
   */
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
      await this.send('request-unregister', { command: '000', type: 'unregister' });
    });
  }
}
