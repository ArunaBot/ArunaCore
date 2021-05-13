class WebSocketParser {
    constructor(prefix) {
        this.prefix = prefix;
    }

    parser() {

    }

    iParser(who) {
        return `:${this.prefix} 001 ${who} :Welcome to ArunaCore!`;
    }

    icParser() {
        return `:${this.prefix} 011 UNKNOW :Invalid Connection from UNKNOW, are you waiting a module become ready?`;
    }

    mrParser(who) {
        return `:${this.prefix} 010 CORE :${who}`;
    }
}

module.exports = WebSocketParser;