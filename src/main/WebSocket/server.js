/*
    This file is part of ArunaCore.

    ArunaCore is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    ArunaCore is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with ArunaCore.  If not, see <https://www.gnu.org/licenses/>
*/

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
        var parser = this.parser;
        const stopWebSocket = this.stop;
        const timeout = setTimeout(() => {
            this.logger.fatal('The Core Isn\'t Ready!');
        }, 60000);

        WebSocket.on('connection', function connection(WSS) {
            var iTimeout = setTimeout(() => {
                this.logger.error('Error: Invalid WebSocket Connection!');
                connections.core.send(parser.icParser());
                return WSS.close();
            }, 60000);

            WSS.on('message', function incoming(rawMessage) {
                var message = parser.parser(rawMessage);

                if (message.final) {
                    WSS.send(parser.fParser(message.who));
                    stopWebSocket(WebSocket, connections);
                }

                if (message.initial) {
                    clearTimeout(iTimeout);
                    if (message.who.toLowerCase() === 'core' && !connections['core']) {
                        connections['core'] = WSS;
                        clearTimeout(timeout);
                        return WSS.send(parser.iParser(message.who));
                    }
                    connections[message.who.toLowerCase()] = WSS;
                    connections.core.send(parser.mrParser(message.who));
                    return WSS.send(parser.iParser(message.who));
                }

                if (message.hasTo) {
                    return connections[message.to.toLowerCase()].send(rawMessage);
                }
            });
        });
    }

    /**
     * Finish all connections and Stop the WebSocket Server.
     * @param {Object<WebSocket>} [connections]
     * @return {Promise<void>}
     */
    async stop(WebSocket, connections) {
        return new Promise((resolve) => {
            if (connections && connections['core']) {
                for (const key in connections) {
                    connections[key].close();
                }
            }
            WebSocket.close();
            resolve();
        });
    }

}

module.exports = WebSocketServer;
