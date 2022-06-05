import { Logger, WebSocketParser, utils } from '../';
import { EventEmitter } from 'events';
import ws from 'ws';

export class WebSocketClient extends EventEmitter {
  public WSParser: WebSocketParser;
  private ws: ws.WebSocket;
  private logger: Logger;
  private host: string;
  private port: number;
  private id: string;

  constructor(host: string, port: number, id: string, logger?: Logger) {
    super();
    this.id = id;
    this.host = host;
    this.port = port;
    this.WSParser = new WebSocketParser();
    this.logger = logger ?? new Logger({ prefix: 'WSClient' });
  }

  public async connect(): Promise<void> {
    this.ws = new ws(`ws://${this.host}:${this.port}`);
    return new Promise((resolve, reject) => {
      this.ws.on('message', (message) => { this.onMessage(message.toString()); });

      this.ws.on('close', (code, reason) => { this.emit('close', code, reason); });

      this.ws.on('error', (err) => { this.emit('error', err); });

      this.ws.on('open', () => {
        this.logger.debug('Connected to server!');
        this.logger.debug('Registering client...');
        this.register();
        resolve();
      });

      this.ws.on('error', (err) => {
        this.logger.error(err);
        reject(err);
      });
    });
  }

  public async send(command: string, args: string[], to?: string, type?: string): Promise<void> {
    return new Promise((resolve, reject) => {
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
          this.logger.debug('Client Registered!');
          this.emit('ready');
        } else if (parsedMessage.args[0] === 'unregister-success') {
          this.logger.debug('Client Unregistered!');
          this.emit('finish');
        } else {
          this.emit('message', parsedMessage);
        }
        break;
      default:
        this.emit('message', parsedMessage);
        break;
    }
  }

  public register(): void {
    this.send('000', ['register', process.env.npm_package_version ?? '', process.env.npm_package_version ?? '']);
  }

  public async ping(): Promise<boolean> {
    return new Promise((resolve, reject) => {
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

  public async finish(): Promise<void> {
    return new Promise(async (resolve) => {
      await this.send('000', ['unregister']);

      await utils.sleep(3000);
      this.ws.close(1000);
      return resolve();
    });
  }
}
