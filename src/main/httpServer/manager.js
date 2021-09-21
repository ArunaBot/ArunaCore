const HTTPServer = require('./server');

const path = require('path');
const webSocketParser = require(path.resolve(__dirname, '..', 'WebSocket', 'parser'));
const pkg = require(path.resolve(__dirname, '..', '..', '..', 'package.json'));

var wsParser;

class HTTPManager extends HTTPServer {
    constructor(debug, host, port, prefix, corePrefix, ws) {
        super(debug, host, port, prefix, corePrefix, ws);
        wsParser = new webSocketParser(this.prefix, this.corePrefix);
        this.existingRoutes = [];
        this.debug = debug;
    }

    /**
     * Start the HTTP server
     */
    async start() {
        this.exp.get('/', (req, res) => {
            res.sendFile(path.resolve(__dirname, 'default.html'));
        });

        this.exp.get('/arunaData', (req, res) => {
            res.send({
                version: pkg.version,
                fullpath: __dirname,
                debug: this.debug,
            });
        });

        return await super.start();
    }

    /**
     * Request a route  and register the path to module
     * @param {string} route - The route to request
     * @param {string} module - The module to register
     * @return {Promise<Void>}
     */
    async request(route, module) {
        return new Promise((resolve, reject) => {
            if (this.existingRoutes.includes(route)) {
                this.logger.error('Route already exists!');
                this.logger.debug(`The Route  ${route} requested by ${module} is already registered!`);
                return reject('Route already exists!');
            }
            
            this.existingRoutes.push(route);

            this.exp.all(route, (req, res, next) => {
                this.ws.send(`:${this.prefix} 110 ${module} :req ${req.toString()}`);
                this.ws.on('message', (msg) => {
                    const data = wsParser.parse(msg);
                    if (data.command === 111) {
                        const params = data.params;
                        if (!isNaN(params[0])) {
                            res.status(params.shift()).send(params.join(' '));
                        } else {
                            res.send(params.join(' '));
                        }
                    }
                });
                next();
            });
            resolve();
        });
    }
}

module.exports = HTTPManager;
