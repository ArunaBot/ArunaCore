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
const EventEmitter = require('events');
const { logger: LoggerC, ModuleLoader } = require(path.resolve(__dirname,'Utils'));

var logger;
var args;

class Main extends EventEmitter {
    constructor() {
        super();
        logger = new LoggerC({ debug: true, prefix: 'CORE' });
    }

    start() {
        logger.debug('Hello World!');
        args = process.argv.slice(2);

        if (args) {
            switch (args[0]) {
                case 'installer':
                case 'install':
                    break;
                default:
                    break;
            }
            return;
        }

        const loader = new ModuleLoader();
    }
}

new Main().start();