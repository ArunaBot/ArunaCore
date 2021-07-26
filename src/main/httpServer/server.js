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
const { logger: LoggerC } = require(path.resolve(__dirname, '..', 'Utils'));

var logger;

class HTTPServer {
    constructor(host, port, prefix, debug, ws) {
        this.ws = ws;
        this.host = host;
        this.port = port;
        this.debug = debug;
        this.prefix = prefix;
        this.isRunning = false;
        logger = new LoggerC({ prefix: this.prefix, debug: this.debug });
    }

    start() {
        const exp = express();
        return new Promise((resolve, reject) => {
            const server = http.createServer(exp);

            server.on('error', (err) => {
                logger.fatal(err);
                reject(err);
            });

            server.listen(this.port, () => {
                this.isRunning = true;
                logger.info(`HTTP Server started on port ${this.port}`);
                this.app = server;
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
