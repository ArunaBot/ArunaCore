import { ConnectionStructure } from '../structures';
import { Logger } from '@promisepending/logger.js';
import { format } from '../../utils';
import { Socket } from '../socket';
import * as wss from 'ws';

export class ConnectionManager {
  private connections: Map<string, ConnectionStructure> = new Map();
  private pingLoopTimeout: any;
  private requireAuth: boolean;
  private logger: Logger;
  private socket: Socket;

  constructor(socket: Socket) {
    this.socket = socket;
    this.logger = socket.getLogger();
    this.requireAuth = socket.isAuthRequired();

    this.logger.info('Connection manager initialized!');
  }

  public onConnection(ws: wss.WebSocket):void {
    ws.on('message', (message) => this.socket.getMessageHandler().onMessage({ data: message, target: ws, type: '' }, ws));
  }

  // public async unregisterConnection(connection: ConnectionStructure, message: IMessage): Promise<void> {
  public async unregisterConnection(connection: ConnectionStructure): Promise<void> {
    if (await this.ping(connection)) {
      connection.send(format('unregister-success', { command: '000', args: ['goodbye! O/'], target: { id: connection.getID() }, type: 'register' }));
      connection.close(1000);
    }

    this.connections.delete(connection.getID());
  }

  /**
   * @private
   */
  public addConnection(connection: ConnectionStructure): void {
    this.connections.set(connection.getID(), connection);
  }

  /**
   * Send a ping for a specific connection and remove it from the list if it's dead
   * @param connection the connection to ping
   * @returns {Promise<boolean>} a promise with a boolean value if the connection is alive [True] for alive and [False] for terminated
   */
  public async ping(connection: ConnectionStructure): Promise<boolean> {
    const pingResult = await connection.ping();

    if (!pingResult) {
      this.logger.warn(`Connection ${connection.getID()} appears to be dead, removing it from the list...`);
      this.connections.delete(connection.getID());
    }

    return pingResult;
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
    this.connections.forEach((connection) => {
      this.ping(connection);
    });
  }

  public shutdown(): void {
    this.connections.forEach((connection) => {
      connection.close(1012, 'ArunaCore is Shutting Down');
      this.connections.delete(connection.getID());
    });
    this.logger.warn('Stopping ping loop...');
    clearInterval(this.pingLoopTimeout);
    this.pingLoopTimeout = null;
  }

  /**
   * @param connection
   * @param reason
   * @param code
   * @deprecated Use connection.close() instead
   */
  public close(connection: ConnectionStructure, reason?: string, code = 1000): void {
    connection.close(code, reason);
  }

  public getConnections(): Map<string, ConnectionStructure> {
    return this.connections;
  }

  public getAliveConnections(): Map<string, ConnectionStructure> {
    return new Map(Array.from(this.connections).filter(([, connection]) => connection.getIsAlive()));
  }

  public getConnection(id: string): ConnectionStructure | undefined {
    return this.connections.get(id);
  }
}
