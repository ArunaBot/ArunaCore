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

class WebSocketParser {
    constructor(prefix) {
        this.prefix = prefix;
    }

    parser(rawMessage) {
        const ircMessage = rawMessage.split(/ +/g);
        const sender = ircMessage[0].substr(1);
        const command = ircMessage[1];
        var destination = ircMessage[2];
        ircMessage.splice(0, 3);
        var params = ircMessage;
        var hasTo = true;

        if (destination.startsWith(':')) {
            params = destination.slice(2).split(/ +/g);
            destination = 'CORE';
            hasTo = false;
        }

        params[0] = params[0].startsWith(':') ? params[0].replace(':', '') : params[0];

        if (destination === this.prefix) {
            hasTo = false;
        }

        const obj = {
            initial: false,
            who: sender,
            hasTo: hasTo,
            to: destination,
            command: command,
            params: params
        };

        switch (command) {
            case '000':
                if (destination === this.prefix && params[0] === 'EnableWS') {
                    obj.initial = true;
                    return obj;
                } else if (destination === this.prefix && params[0] === 'DisableWS' && sender === 'CORE') {
                    obj.final = true;
                    return obj;
                }
                return obj;
            default:
                return obj;
        }
    }

    /**
     * Return the initial module connection message
     * @param {String} [who]
     * @return {String} [formattedMessage]
     */
    iParser(who) {
        return `:${this.prefix} 001 ${who} :Welcome to ArunaCore!`;
    }

    /**
     * Return a invalid connection message
     * @return {String} [formattedMessage]
     */
    icParser() {
        return `:${this.prefix} 011 UNKNOW :Invalid Connection from UNKNOW, are you waiting a module become ready?`;
    }

    /**
     * Return a message received from a module to the core
     * @param {String} [who]
     * @return {String} [formattedMessage]
     */
    mrParser(who) {
        return `:${this.prefix} 010 CORE :${who}`;
    }

    /**
     * Return the end WebSocket Server message
     * @param {String} [who]
     * @return {String} [formattedMessage]
     */
    fParser(who) {
        return `:${this.prefix} 002 ${who} :Goodbye, ArunaCore!`;
    }
}

module.exports = WebSocketParser;
