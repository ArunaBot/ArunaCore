const yaml = require('yaml');
const path = require('path');
const fs = require('fs');

const pkg = require(path.resolve(__dirname, '..', '..', '..', 'package.json'));

class ModuleParser {
    constructor(logger) {
        this.logger = logger;
    }

    async parser(dir) {
        const arunamodule = fs.readFileSync(dir, 'utf8');
        var obj = await yaml.parse(arunamodule);

        return new Promise((resolve, reject) => {
            if (!obj) {
            // eslint-disable-next-line max-len
                this.logger.error(`The module present in the ${dir.replace('.arunamodule', '')} directory has an invalid .arunamodule file.\n\nPlease ask the module's author to verify what happened.`);
                return reject();
            }

            var finalObj = {};

            switch (obj.fileVersion) {
                case 1:
                    parserV1();
                    break;
                default:
                    this.logger.warn(`The Module ${obj.moduleInfo.name} is using an unknown version of the parser, I will do the best I can.`);
                    parserLatest();
                    break;
            }

            function parserLatest() {
                parserV1();
            }

            function parserV1() {
                finalObj.name = obj.moduleInfo.name;
                finalObj.version = obj.moduleInfo.version;
                finalObj.author = obj.moduleInfo.author;
                finalObj.license = obj.moduleInfo.license;
                finalObj.repository = obj.moduleInfo.repository;

                if (obj.moduleInfo.engines && obj.moduleInfo.engines.core) {
                    finalObj.requireCore = obj.moduleInfo.engines.core;
                    delete obj.moduleInfo.engines.core;
                }

                finalObj.engines = obj.moduleInfo.engines || {};

                if (!finalObj.engines.npm) {
                    finalObj.engines.npm = 'please-use-yarn';
                }

                if (!finalObj.engines.yarn) {
                    finalObj.engines.yarn = pkg.engines.yarn;
                }

                finalObj.scripts = obj.nodeInfo.scripts || {};
                
                if (!finalObj.scripts.preinstall) {
                    finalObj.scripts.preinstall = 'node -e \'if(!/yarn\\.js$/.test(process.env.npm_execpath))throw new Error("Use yarn")\'';
                }

                if (!obj.nodeInfo.scripts.start) {
                    obj.nodeInfo.scripts.start = 'node .';
                }

                finalObj.scripts.start = 'NODE_PATH=' + path.resolve(__dirname, '..', '..', '..', 'dependencies', 'modules') + ' ' + obj.nodeInfo.scripts.start;
                
                finalObj.core = { NODE_PATH: path.resolve(__dirname, '..', '..', '..', 'dependencies', 'modules') };

                finalObj.keywords = obj.nodeInfo.keywords;
                finalObj.bugs = obj.nodeInfo.bugs;
                finalObj.homepage = obj.nodeInfo.homepage;

                finalObj.dependencies = obj.nodeInfo.dependencies;
                finalObj.devDependencies = obj.nodeInfo.devDependencies;

                Object.entries(finalObj).forEach(([key, val]) => {
                    if (val === null || val === undefined) {
                        delete finalObj[key];
                    }
                });

                return resolve(finalObj);
            }
        });
    }

    async getInstalledModules(moduleList) {
        this.modules = [];

        var read = fs.readFileSync(moduleList);

        read = JSON.parse(read);

        Object.entries(read).forEach(([key, val]) => {
            if (!fs.existsSync(val)){
                delete read[key];
            } else {
                this.modules.push(val);
                this.logger.debug(`${key} module found as installed.`);
            }
        });

        fs.writeFileSync(moduleList, JSON.stringify(read));

        return Promise.resolve(this.modules);
    }

    /**
     * Check if module is enabled
     * returns true if enabled, false if not and module name
     * @param {string} .arunaModule directory
     * @return {boolean}
     * @return {string}
     */
    async isModuleEnabled(module) {
        if (!module.existsSync()) {
            return false;
        }

        const arunaModule = fs.readFileSync(module, 'utf8');
        const obj = await yaml.parse(arunaModule);

        return obj.enabled;
    }
}

module.exports = ModuleParser;
