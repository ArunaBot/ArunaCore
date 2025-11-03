import { IMessage, IWebsocketOptions } from '../interfaces';
import { Logger } from '@promisepending/logger.js';
import { version } from '../resources/version';
import { WebSocketParser, utils } from '../';
import { EventEmitter } from 'events';
import ws from 'ws';

interface ArunaEvents {
  'ready': [];
  'message': [IMessage];
  'unauthorized': [IMessage];
  'error': [Error];
  'close': [number, string];
  'finish': [];
  [command: string]: [...any];
}

/**
 * The main WebSocket client for connecting to an ArunaCore server.
 * Handles connection, authentication, messaging, and event management.
 *
 * @remarks
 * This client supports secure and shard modes, emits events for connection lifecycle and message handling,
 * and provides methods for sending messages, pinging, and closing the connection.
 *
 * @extends EventEmitter
 *
 * @example
 * import { ArunaClient } from 'aruna-api';
 * const client = new ArunaClient({
 *   host: 'localhost',
 *   port: 3000,
 *   secureMode: false,
 *   shardMode: false,
 *   secureKey: null,
 *   logger: null,
 *   id: 'client'
 * });
 * client.on('ready', () => {
 *   console.log('Client is ready!');
 * });
 * client.on('message', (message) => {
 *   console.log(message);
 * });
 * await client.connect(); // Optionally pass secureKey
 */
export class ArunaClient extends EventEmitter<ArunaEvents> {
  private finishTimeout: ReturnType<typeof setTimeout> | null = null;
  private secureKey: string | null = null;
  private ws: ws | null = null;
  private secureMode: boolean;
  private shardMode: boolean;
  private logger: Logger;
  private host: string;
  private port: number;
  private id: string;

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
   * Establishes a WebSocket connection to the ArunaCore server.
   *
   * @param {string?} [secureKey] Optional secure key for authentication in secure mode. If provided, enables secure mode.
   * @returns {Promise<void>} Promise that resolves when the connection is established, or rejects on error.
   * @throws Error if secure mode is enabled but no secure key is provided, or if shard mode is enabled without secure mode.
   */
  public async connect(secureKey?: string): Promise<void> {
    if (secureKey) {
      this.secureKey = secureKey;
      this.secureMode = true;
    }
    
    this.ws = new ws(`ws://${this.host}:${this.port}`, {
      headers: {
        'Authorization': this.secureKey ?? '',
        'ArunaCore-API-Version': version,
        'Client-ID': this.id,
      },
    });

    return new Promise((resolve, reject) => {
      this.ws!.on('message', (message) => { this.onMessage(message.toString()); });

      this.ws!.on('close', (code, reason) => { this.emit('close', code, reason.toString()); });

      this.ws!.on('error', (err) => { this.emit('error', err); });

      this.ws!.on('open', () => {
        this.logger.debug('Connected to server!');
        this.emit('ready');
        return resolve();
      });

      this.ws!.on('error', (err) => {
        this.logger.error(err);
        return reject(err);
      });

      this.ws!.on('unexpected-response', (req, res) => {
        if (res.statusCode === 401) {
          this.logger.error('Unauthorized: Invalid secure key!');
          this.ws?.close();
          reject(new Error('Unauthorized: Invalid secure key!'));
        } else if (res.statusCode === 409) {
          this.logger.warn('Conflict: Client ID already connected! Randomizing a new one...');
          this.id = this.id + utils.randomString(5);
          this.connect().then(() => {
            return resolve();
          }).catch((err) => {
            reject(err);
          });
        } else if (res.statusCode === 412) {
          this.logger.error('Precondition Failed: Unsupported API version!');
          this.ws?.close();
          return reject(new Error('Precondition Failed: Unsupported API version!'));
        } else {
          this.logger.error(`Unexpected response: ${res.statusCode}`);
          this.ws?.close();
          return reject(new Error(`Unexpected response: ${res.statusCode}`));
        }
      });
    });
  }

  /**
   * Sends a message to the ArunaCore server.
   *
   * @param {unknown} content The message content, can be a string or a serializable object.
   * @param {Object} options Message options.
   * @param {string} [options.type] Type of the client or message.
   * @param {string} [options.command] Command code for the message.
   * @param {{ id: string, key?: string }} [options.target] Target recipient (id and optional key).
   * @param {string[]} [options.args] Arguments for the message.
   * @returns {Promise<void>} Promise that resolves when the message is sent, or rejects if the connection is not open or secure key is missing in secure mode.
   *
   * @example
   * await client.send('100', {
   *   args: ['Hello World!'],
   *   target: { id: 'server', key: 'serverKey' },
   *   type: 'client',
   *   command: 'someCommand'
   * });
   */
  public async send(content: unknown, { type, command, target, args }: { type?: string, command?: string, target?: { id: string, key?: string }, args?: string[] }): Promise<void> {
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
   * Handles incoming messages from the ArunaCore server.
   * Parses the message and emits the appropriate events.
   *
   * @param {string} message The raw message string received from the server.
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
        if (parsedMessage.content === 'unregister-success') {
          this.logger.debug('Client Unregistered!');
          this.emit('finish');
        } else {
          this.emit('message', parsedMessage);
        }
        break;
      case '401':
        this.emit('unauthorized', parsedMessage);
        break;
      default:
        this.emit('message', parsedMessage);
        if (parsedMessage.command) this.emit(parsedMessage.command, parsedMessage);
        break;
    }
  }

  /**
   * Sends a ping frame to the ArunaCore server to check connectivity.
   *
   * @returns {Promise<boolean>} Promise that resolves to true if the ping succeeds, or rejects on error.
   *
   * @example
   * await client.ping();
   * // => Pong!
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
   * Gets the current client ID.
   *
   * @returns {string} The client ID string.
   */
  public getID(): string {
    return this.id;
  }

  /**
   * Gracefully closes the connection to the ArunaCore server.
   * Sends an unregister request and waits for confirmation or times out after 5 seconds.
   *
   * @returns {Promise<void>} Promise that resolves when the connection is closed.
   *
   * @example
   * await client.finish();
   * // => Connection closed!
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
