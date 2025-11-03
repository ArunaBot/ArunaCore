import { IMessage, IReconnectionOptions, IWebsocketOptions } from '../interfaces';
import { setTimeout, setInterval, clearInterval, clearTimeout } from 'timers';
import { Logger } from '@promisepending/logger.js';
import { version } from '../resources/version';
import { WebSocketParser, utils } from '../';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import ws from 'ws';

interface ArunaEvents {
  'ready': [];
  'message': [IMessage];
  'request': [IMessage];
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
  private reconnectionConfig: IReconnectionOptions = { enabled: true, maxAttempts: -1, delay: 5000 };
  private reconnectionLoop: ReturnType<typeof setInterval> | null = null;
  private finishTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectionAttempts: number = 0;
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
    this.reconnectionConfig = options.reconnection ? { ...this.reconnectionConfig, ...options.reconnection } : this.reconnectionConfig;
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

      this.ws!.on('error', (err: any) => {
        if (err.code === 'ECONNREFUSED' && this.reconnectionConfig.enabled) {
          this.logger.warn(`Cannot connect to server. Retrying in ${this.reconnectionConfig.delay}ms...`);
          this.startReconnectionLoop();
          return;
        }
        this.emit('error', err);
      });

      this.ws!.on('open', () => {
        this.logger.debug('Connected to server!');
        this.emit('ready');
        return resolve();
      });

      this.ws!.on('unexpected-response', (req, res) => {
        switch (res.statusCode) {
          case 401:
            this.logger.error('Unauthorized: Invalid secure key!');
            this.ws!.close();
            return reject(new Error('Unauthorized: Invalid secure key!'));
          case 409:
            this.logger.warn('Conflict: Client ID already connected! Randomizing a new one...');
            this.id = this.id + utils.randomString(5);
            this.startReconnectionLoop();
            return;
          case 412:
            this.logger.error('Precondition Failed: Unsupported API version!');
            this.ws!.close();
            return reject(new Error('Precondition Failed: Unsupported API version!'));
          default:
            this.logger.error(`Unexpected response: ${res.statusCode}`);
            this.ws!.close();
            return reject(new Error(`Unexpected response: ${res.statusCode}`));
        }
      });
    });
  }

  private startReconnectionLoop(): void {
    if (this.reconnectionLoop) return;

    this.reconnectionLoop = setInterval(async () => {
      this.ws?.terminate();
      this.ws?.removeAllListeners();
      this.ws = null;
      if (this.reconnectionConfig.maxAttempts !== -1 && this.reconnectionAttempts >= this.reconnectionConfig.maxAttempts!) {
        this.logger.error('Max reconnection attempts reached. Stopping reconnection attempts.');
        this.stopReconnectionLoop();
        return;
      }

      this.reconnectionAttempts += 1;
      this.logger.info(`Reconnection attempt ${this.reconnectionAttempts}...`);

      try {
        await this.connect(this.secureKey ?? undefined);
        this.logger.info('Reconnected successfully!');
        this.stopReconnectionLoop();
        this.reconnectionAttempts = 0;
      } catch (err) {
        this.logger.error(`Reconnection attempt ${this.reconnectionAttempts} failed:`, err);
      }
    }, this.reconnectionConfig.delay);
  }

  private stopReconnectionLoop(): void {
    if (this.reconnectionLoop) {
      clearInterval(this.reconnectionLoop);
      this.reconnectionLoop = null;
    }
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
   * Sends a request to a specific target and waits for a response.
   *
   * @param {unknown} content The message content, can be a string or a serializable object.
   * @param {Object} options Request options.
   * @param {{ id: string, key?: string }} options.target Target recipient (id and optional key).
   * @param {number} [options.timeoutMs=10000] Timeout in milliseconds to wait for the response.
   * @returns {Promise<IMessage>} Promise that resolves with the response message or rejects on error or timeout.
   *
   * @throws {Error} If the secure key is required and not set, or if the connection is not open.
   *
   * @example
   * const response = await client.request('ping', {
   *   target: { id: 'server', key: 'serverKey' },
   *   timeoutMs: 5000
   * });
   * console.log(response);
   */
  public async request(content: unknown, { target, timeoutMs = 10000 }: { target: { id: string, key?: string }, timeoutMs?: number }): Promise<IMessage> {
    return new Promise(async (resolve, reject) => {
      const uuid = randomUUID();
      const finalFrom: { id: string, key?: string } = {
        id: this.id,
      };

      if (this.secureMode && this.secureKey == null) return reject(new Error('Secure key is required for secure mode!'));
      else if (this.secureKey) Object.assign(finalFrom, { key: this.secureKey });

      const onResponse = (message: IMessage): void => {
        if (message.uuid === uuid) {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          if (timeout) clearTimeout(timeout);
          resolve(message);
        }
      };

      const timeout = setTimeout(() => {
        this.removeListener(`reply-${uuid}`, onResponse);
        reject(new Error('Request timed out'));
      }, timeoutMs);

      this.once(`reply-${uuid}`, onResponse);

      this.ws!.send(WebSocketParser.formatToStringWithUUID(finalFrom, uuid, content, { type: 'request', target }), (err) => {
        if (err) {
          this.logger.error(err);
          this.removeListener(`reply-${uuid}`, onResponse);
          if (timeout) clearTimeout(timeout);
          reject(err);
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

    if (parsedMessage.uuid && parsedMessage.type === 'reply') {
      this.emit(`reply-${parsedMessage.uuid}`, parsedMessage);
      return;
    } else if (parsedMessage.uuid && parsedMessage.type === 'request') {
      parsedMessage.reply = (content: unknown, options?: { args?: string[], toKey?: string }): Promise<void> => {
        const { args, toKey } = options || {};
        return new Promise((resolve, reject) => {
          const finalFrom: { id: string, key?: string } = {
            id: this.id,
          };

          if (this.secureMode && this.secureKey == null) {
            return reject(new Error('Secure key is required for secure mode!'));
          } else if (this.secureKey) Object.assign(finalFrom, { key: this.secureKey });

          const finalTarget: { id: string, key?: string } = {
            id: parsedMessage!.from.id,
          };

          if (toKey) Object.assign(finalTarget, { key: toKey });

          this.ws!.send(
            WebSocketParser.formatToStringWithUUID(
              finalFrom, parsedMessage!.uuid!, content,
              {
                type: 'reply',
                target: finalTarget,
                args,
              },
            ), (err) => {
              if (err) {
                this.logger.error(err);
                reject(err);
              } else {
                resolve();
              }
            });
        });
      };
      this.emit('request', parsedMessage);
    }

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
