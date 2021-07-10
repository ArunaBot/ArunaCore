const path = require('path');
const WebSocket = require('ws');
const WSParser = require('./parser');
const { logger: LoggerC } = require(path.resolve(__dirname, '..', 'Utils'));

class WebSocketServer {
    constructor(debug, port, prefix) {
        this.port = port ? port : 3000;
        this.prefix = prefix ? prefix : 'W.S.S.';
        this.parser = new WSParser(this.prefix);
        this.logger = new LoggerC({ debug: debug, prefix: prefix });
    }

    async start() {
        this.WebSocket = new WebSocket.Server({ port: this.port, perMessageDeflate: false });
        this.startListener(this.WebSocket);
        return Promise.resolve(new WSParser('CORE'));
    }

    startListener(WebSocket) {
        var connections = {};
        const timeout = setTimeout(() => {
            this.logger.fatal('The Core Isn\'t Ready!');
        }, 60000);
        WebSocket.on('connection', function connection(WSS) {
            var iTimeout = setTimeout(() => {
                this.logger.error('Error: Invalid WebSocket Connection!');
                connections.core.send(this.parser.icParser());
                return WSS.close();
            }, 120000);
            WSS.on('message', function incoming(rawMessage) {
                var message = this.parser.parser(rawMessage);

                if (message.initial) {
                    clearTimeout(iTimeout);
                    if (message.who.toLowerCase() === 'core') {
                        connections['core'] = WSS;
                        clearTimeout(timeout);
                        return WSS.send(this.parser.iParser(message.who));
                    }
                    connections[message.who.toLowerCase()] = WSS;
                    connections.core.send(this.parser.mrParser(message.who));
                    return WSS.send(this.parser.iParser(message.who));
                }

                if (message.hasTo) {
                    return connections[message.to.toLowerCase()].send(rawMessage);
                }
            });
        });
    }
}

module.exports = WebSocketServer;
