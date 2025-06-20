import { Logger } from '@promisepending/logger.js';
import { IMessage } from '../../../../api/src';
import { IConnection } from '../../interfaces';
import * as WS from 'ws';

export class ConnectionStructure {
  private id: string;
  private isAlive: boolean;
  private isSecure: boolean;
  private secureKey: string | null;
  private isSharded: boolean;
  private shardID: number | null;
  private shardRootID: string | null;
  private apiVersion: string;
  private connection: WS.WebSocket;
  private logger: Logger;
  private pingTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(info: IConnection, logger: Logger) {
    this.id = info.id;
    this.isAlive = info.isAlive;
    this.isSecure = info.isSecure;
    this.secureKey = info.secureKey ?? null;
    this.isSharded = info.isSharded;
    this.shardID = info.shardID ?? null;
    this.shardRootID = info.shardRootID ?? null;
    this.apiVersion = info.apiVersion;
    this.connection = info.connection;
    this.logger = logger;

    // When the client responds to the ping in time (within the timeout), we state that the client is alive else we close the connection
    this.connection.on('pong', (): void => {
      this.isAlive = true;
      if (this.pingTimeout) {
        clearTimeout(this.pingTimeout);
        this.pingTimeout = null;
      }
    });
  }

  public send(message: IMessage | string): void {
    try {
      this.connection.send(typeof message === 'string' ? message : JSON.stringify(message));
    } catch (e) {
      this.logger.warn('An error occurred while trying to send a message to a client:', e);
    }
  }

  /**
   * Send a ping for a specific connection
   * @param connection the connection to ping
   * @returns {Promise<boolean>} a promise with a boolean value if the connection is alive [True] for alive and [False] for terminated
   */
  public async ping(): Promise<boolean> {
    return new Promise((resolve) => {
      this.isAlive = false;
      this.connection.once('pong', () => resolve(true));

      this.pingTimeout = setTimeout(() => {
        if (!this.isAlive) {
          this.connection.terminate();
          this.connection.removeAllListeners('pong');
          this.logger.warn(`Connection ${this.id} appears to be dead!`);
        }
        return resolve(this.isAlive);
      }, 5000);

      this.connection.ping();
    });
  }

  public close(code: number, reason?: string): void {
    this.connection.close(code, reason);
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
  }

  public getID(): string {
    return this.id;
  }

  public setIsAlive(isAlive: boolean): void {
    this.isAlive = isAlive;
  }

  public getIsAlive(): boolean {
    return this.isAlive;
  }

  public getIsSecure(): boolean {
    return this.isSecure;
  }

  public getSecureKey(): string | null {
    return this.secureKey;
  }

  public getIsSharded(): boolean {
    return this.isSharded;
  }

  public getShardID(): number | null {
    return this.shardID;
  }

  public getShardRootID(): string | null {
    return this.shardRootID;
  }

  public getAPIVersion(): string {
    return this.apiVersion;
  }

  public getConnection(): WS.WebSocket {
    return this.connection;
  }
}
