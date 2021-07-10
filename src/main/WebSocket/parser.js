class WebSocketParser {
    constructor(prefix) {
        this.prefix = prefix;
    }

    parser(rawMessage) {
        const ircMessage = rawMessage.split(' ');
        const sender = ircMessage[0].substr(1);
        const command = ircMessage[1];
        var destination = ircMessage[2];
        var params = ircMessage.slice(3).substr(1).split(' ');
        var hasTo = true;

        if (destination.startsWith(':')) {
            params = destination.slice(2).substr(1);
            destination = 'CORE';
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
}

module.exports = WebSocketParser;