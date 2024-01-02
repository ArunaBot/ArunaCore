import { createServer, IncomingMessage, Server, ServerResponse, STATUS_CODES } from 'http';
import { Logger } from '@promisepending/logger.js';
import { ExtendedRequest } from './structures';
import { EHTTPMethod } from '../enums';
import querystring from 'querystring';

export class HTTPServer {
  private server: Server | null = null;
  private isUpgradeRequired = false;
  private isListen = false;
  private routes: {
    route: string;
    method: string;
    callback: (req: ExtendedRequest, res: ServerResponse) => void;
  }[] = [];

  private logger: Logger;

  constructor(logger: Logger, port?: number) {
    if (!logger) throw new Error('Logger is required');
    this.logger = logger;
    this.registerRoute('/healthcheck', EHTTPMethod.GET, (_req: ExtendedRequest, res: ServerResponse) => {
      res.write('OK');
      res.statusCode = 200;
      return res.end();
    });
    if (port) this.listen(port);
  }

  public registerRoute(route: string, method: EHTTPMethod, callback: (req: ExtendedRequest, res: ServerResponse) => void): void {
    this.routes.push({ route: route.toLowerCase(), method: method.toLowerCase(), callback });
  }

  private async reqListener(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = req.url;
    const method = req.method!;

    const extendedReq = Object.assign(req, { params: {}, body: {} }) as ExtendedRequest;

    const routeFounded = this.routes.find((route) => {
      const routeSplitted = route.route.split('/');
      const urlSplitted = url!.toLowerCase().split('/');
      if (routeSplitted.length !== urlSplitted.length) return false;
      for (let i = 0; i < routeSplitted.length; i++) {
        if (routeSplitted[i] !== urlSplitted[i] && !routeSplitted[i].startsWith(':')) return false;
        if (routeSplitted[i].startsWith(':')) extendedReq.params[routeSplitted[i].slice(1)] = urlSplitted[i];
      }
      return route.method === method.toLowerCase();
    });

    if (routeFounded) {
      // Handle body if method isn't GET or DELETE and only run the callback after the body is fully received
      if (method !== EHTTPMethod.GET && method !== EHTTPMethod.DELETE) {
        let body = '';
        try {
          await new Promise<void>((resolve, reject) => {
            req.on('data', (chunk) => {
              body += chunk.toString();
              if (body.length > 1e6) {
                req.socket.destroy();
                reject(new Error('Body too large'));
              }
            });
            req.on('end', () => {
              const contentType = req.headers['content-type'];
              if (contentType === 'application/json') {
                try {
                  extendedReq.body = JSON.parse(body);
                } catch (e) {
                  reject(e);
                }
              } else if (contentType === 'application/x-www-form-urlencoded') {
                extendedReq.body = querystring.parse(body);
              }

              resolve();
            });
          });
          return routeFounded.callback(extendedReq, res);
        } catch (error) {
          res.statusCode = 500;
          res.end('Internal server error');
          console.error(`An error occurred while parsing request's: ${body}`, error);
        }
      } else {
        return routeFounded.callback(extendedReq, res);
      }
    } else {
      res.statusCode = 404;
      res.end('Not found');
    }
  }

  public listen(port: number): void {
    this.server = createServer(this.reqListener);
    Object.assign(this.server, { routes: this.routes });
    if (this.isListen) return;
    this.server.listen(port);
    this.isListen = true;
  }

  public enableUpgradeRequired(path = '/'): void {
    if (this.isListen || this.isUpgradeRequired) return;
    this.isUpgradeRequired = true;
    this.registerRoute(path, EHTTPMethod.GET, (_req: ExtendedRequest, res: ServerResponse) => {
      const body = STATUS_CODES[426];

      if (!body) {
        res.statusCode = 500;
        res.end('Unknown status code');
        return;
      }

      res.writeHead(426, {
        'Content-Length': body.length,
        'Content-Type': 'text/plain',
      });
      return res.end(body);
    });
  }

  public close(): void {
    this.server?.close();
  }

  public getServer(): Server | null {
    return this.server;
  }

  public on(event: string, callback: any): Server {
    return this.server!.on(event, callback);
  }

  public once(event: string, callback: any): Server {
    return this.server!.once(event, callback);
  }

  public removeListener(event: string, callback: any): Server {
    return this.server!.removeListener(event, callback);
  }

  public removeAllListeners(event: string): Server {
    return this.server!.removeAllListeners(event);
  }
}
