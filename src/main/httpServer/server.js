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

const express = require('express');
const path = require('path');
const http = require('http');
const EventEmitter = require('events');
const { logger: LoggerC } = require(path.resolve(__dirname, '..', 'Utils'));

var logger;
var exp;
class HTTPServer extends EventEmitter {
    constructor(debug, host, port, prefix, corePrefix, ws) {
        super();
        this.ws = ws;
        this.host = host || 'localhost';
        this.port = port || 8080;
        this.debug = debug || false;
        this.prefix = prefix || 'IHTTP';
        this.isRunning = false;
        logger = new LoggerC({ prefix: this.prefix, debug: this.debug });
        this.logger = logger;
        exp = express();
        this.exp = exp;
    }

    start() {
        return new Promise((resolve, reject) => {
            const server = http.createServer(exp);

            server.on('error', (err) => {
                logger.fatal(err);
                reject(err);
            });

            server.listen(this.port, () => {
                this.isRunning = true;
                logger.info(`Internal HTTP Server started on port ${this.port}`);
                this.app = server;
                this.emit('ready');
                resolve(this.app);
            });
        });
    }

    getHttpInstance() {
        if (this.isRunning) {
            return this.app;
        }

        return this.start();
    }
}

module.exports = HTTPServer;
