import { IConnection } from './interfaces';
import { IMessage, Logger, WebSocketParser } from '@arunabot/core-common';
import semver from 'semver';
import * as wss from 'ws';

export class Socket {
  private ws: wss.Server;
  private logger: Logger;
  private timeouts: any[] = [];
  private parser = new WebSocketParser({});
  private connections: IConnection[] = [];

  constructor(port: number, logger: Logger) {
    this.ws = new wss.Server({ port: port }); // Creates a new websocket server
    this.ws.on('connection', this.onConnection); // When a connection is made, call the onConnection function
    this.logger = logger;
    this.pingLoop();
  }

  private onConnection(ws: wss.WebSocket):void {
    ws.on('message', this.onMessage);
    setTimeout(() => {
      this.connections.forEach((connection: IConnection) => {
        if (connection.connection === ws) return;
        ws.terminate();
      });
    }, 30000);
    // When the client responds to the ping in time (within the timeout), we state that the client is alive else we close the connection
    ws.on('pong', (): void => {
      this.connections.forEach((connection: IConnection) => {
        if (connection.connection === ws) {
          connection.isAlive = true;
        }
      });
    });
  }

  private async onMessage(message: wss.MessageEvent): Promise<void> {
    const data: IMessage = this.parser.parse(message.data.toString());

    const conectionsFounded = this.connections.find((connection: IConnection) => connection.id === data.from);

    if (!conectionsFounded || data.args[0] === 'register') {
      this.registerConnection(message.target, data);
      return;
    }

    if (!data.to) return;

    const toConnectionsFounded = this.connections.find((connection: IConnection) => connection.id === data.to);

    if (!toConnectionsFounded) {
      this.send(message.target, 'arunacore', '404', ['target', 'not-found'], data.from); // Message example: :arunacore 404 :target not-found [from-id]
      return;
    }

    // ping the sender to check if it's alive
    if (!await this.ping(conectionsFounded)) {
      this.send(message.target, 'arunacore', '404', ['target', 'not-found'], data.from);
      return;
    }

    console.log(data);
  }

  /**
   * Register a new connection on the server
   * @param ws the websocket connection
   * @param info the original message
   */
  private async registerConnection(ws: wss.WebSocket, info: IMessage): Promise<void> {
    const conectionsFounded = this.connections.find((connection: IConnection) => connection.id === info.from);
    if (!conectionsFounded) {
      // Register connection
      if (info.args.length <= 1) {
        ws.send(this.parser.toString(this.parser.format('arunacore', '401', ['invalid', 'register', 'message'])));
      } else {
        // Let's check if core version matches the api necessities
        const coreMinimumVersion: string = info.args[1]; // Minimum version
        const coreMaximumVersion: string = info.args[2]; // Maximum version

        if (!semver.satisfies(process.env.npm_package_version, `>=${coreMinimumVersion} <=${coreMaximumVersion}`)) {
          ws.close(505, this.parser.toString(this.parser.format('arunacore', '505', ['invalid', 'version'], info.from))); // closes the connection with the user, Message example: :arunacore 505 :invalid version [from-id]
          return;
        }

        const connection: IConnection = {
          id: info.from,
          type: info.type,
          isAlive: true,
          connection: ws,
          apiVersion: info.args[3],
        };

        this.connections.push(connection); // Add connection to list
        ws.send(this.parser.toString(this.parser.format('arunacore', '000', ['register-success'], info.from))); // sends a message to the user letting them know it's registered, Message example: :arunacore 000 :register-success
      }
    } else if (info.args[0] === 'register') {
      if (!await this.ping(conectionsFounded)) {
        this.registerConnection(ws, info);
        return;
      }
      // Send a message to the client informing that the connection with this id is already registered
      ws.send(this.parser.toString(this.parser.format('arunacore', '401', ['invalid', 'register', 'id-already-registered'], info.from))); // Message example: :arunacore 401 :invalid register id-already-registered [from-id]
    }
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

  public finishWebSocket():void {
    this.connections.forEach((connection: IConnection) => {
      this.close(connection.connection, 255, 'ArunaCore is shutting down');
    });
    this.ws.close();
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

  /**
   * Call the function massPing every 30 seconds to check if the connections are alive
   */
  private pingLoop():void {
    setInterval(() => this.massPing(), 30000);
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

  private close(connection: wss.WebSocket, code?: number, reason?: string):void {
    connection.close(code || 0, reason);
  }
}
