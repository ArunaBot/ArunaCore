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

/**
 * @author @TwitchApis
 * This file is based on @TwitchApis logger.
 */

const path = require('path');
var chalk = require('chalk');
var dateParser = require(path.resolve(__dirname,'DateParser'));

/**
 * Logger Class
 * @constructor
 * @optional @param {Object} [config] - Configuration object
 * @optional @param {Boolean} [config.debug] - Enable debug logging
 * @optional @param {String} [config.prefix] - Prefix for log messages
 */
class logger {
    constructor(options) {
        this.debugActive = options ? options.debug : false;
        this.prefix = options ? options.prefix : false;
    }

    /**
     * Crash the process with a message
     * @param {String} [message] - The message to crash with
     * @param {Object} [data] - Additional data to crash with (replace message)
     */
    fatal(Message) {
        if (typeof Message === 'object') Message = JSON.stringify(Message);
        // eslint-disable-next-line max-len
        console.trace(chalk.bgWhite(chalk.red(Message.toString().split(' ')[0].toLowerCase().includes('error') ? `[${dateParser.getTime()}] [${this.prefix}] Fatal ${Message}` : `[${dateParser.getTime()}] [${this.prefix}] Fatal: ${Message}`)));
        process.exit(5);
    }
    
    /**
     * Log a error
     * @param {String} [message] - The message to log
     * @param {Object} [data] - Additional data to log (replace message)
     */
    error(Message) {
        if (typeof Message === 'object') Message = JSON.stringify(Message);
        // eslint-disable-next-line max-len
        console.error(chalk.red(Message.toString().split(' ')[0].toLowerCase().includes('error') ? `[${dateParser.getTime()}] [${this.prefix}] ${Message}` : `[${dateParser.getTime()}] [${this.prefix}] Error: ${Message}`));
    }
    
    /**
     * Log a warning
     * @param {String} [message] - The message to log
     * @param {Object} [data] - Additional data to log (replace message)
     */
    warn(Message) {
        if (typeof Message === 'object') Message = JSON.stringify(Message);
        console.warn(chalk.keyword('orange')(`[${dateParser.getTime()}] [${this.prefix}] Warn: ${Message}`));
    }

    /**
     * Log a info
     * @param {String} [message] - The message to log
     * @param {Object} [data] - Additional data to log (replace message)
     */
    info(Message) {
        if (typeof Message === 'object') Message = JSON.stringify(Message);
        console.info(chalk.blueBright(`[${dateParser.getTime()}] [${this.prefix}] `) + `Info: ${Message}`);
    }

    /**
     * Triggers "info"
     * @deprecated
     * @deorecationDetail Use "info" instead
     * @param {String} [message] - The message to log
     * @param {Object} [data] - Additional data to log (replace message)
     */
    log(Message) {
        this.info(Message);
    }

    /**
     * Log a debug
     * @param {String} [message] - The message to log
     * @param {Object} [data] - Additional data to log (replace message)
     */
    debug(Message) {
        if (this.debugActive) {
            if (typeof Message === 'object') Message = JSON.stringify(Message);
            console.debug(chalk.gray(`[${dateParser.getTime()}] [${this.prefix}] Debug: `) + chalk.hex('#AAA')(Message));
        }
    }
}

module.exports = logger;
