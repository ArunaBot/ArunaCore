import { createServer, Server, STATUS_CODES } from 'http';

export class HTTPServer {
  private isUpgradeRequired = false;
  private routes: any[] = [];
  private isListen = false;
  private server: Server;

  constructor(port?: number) {
    if (port) this.listen(port);
  }

  public registerRoute(route: string, method: string, callback: any): void {
    this.routes.push({ route, method: method.toLowerCase(), callback });
  }

  private reqListener(req: any, res: any): any {
    const url = req.url;
    const method = req.method;

    const routeFounded = this.routes.find((route) => route.route === url && route.method === method.toLowerCase());

    if (routeFounded) {
      return routeFounded.callback(req, res);
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
    this.registerRoute(path, 'get', (req: any, res: any) => {
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
    this.server.close();
  }

  public getServer(): Server {
    return this.server;
  }

  public on(event: string, callback: any): Server {
    return this.server.on(event, callback);
  }

  public once(event: string, callback: any): Server {
    return this.server.once(event, callback);
  }

  public removeListener(event: string, callback: any): Server {
    return this.server.removeListener(event, callback);
  }

  public removeAllListeners(event: string): Server {
    return this.server.removeAllListeners(event);
  }
}
