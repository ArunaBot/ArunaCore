const yaml = require('yaml');
const fs = require('fs');

class ModuleParser {
    constructor(logger, moduleList) {
        this.logger = logger;
        this.moduleList = moduleList;
    }

    parser() {
    }

    getInstalledModules() {
        this.modules = [];

        var read = fs.readFileSync(this.moduleList);

        read = JSON.parse(read);

        Object.entries(read).forEach(([key, val]) => {
            this.modules.push(val);
            this.logger.debug(`${key} module found as installed.`);
        });

        return this.modules;
    }
}

module.exports = ModuleParser;