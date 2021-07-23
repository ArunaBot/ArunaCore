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
                finalObj.description = obj.moduleInfo.description;
                finalObj.main = obj.nodeInfo.main || 'index.js';
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
     * @param {String} [.arunaModuleDirectory]
     * @return {Boolean}
     * @return {String}
     */
    async isModuleEnabled(module) {
        if (!fs.existsSync(module)) {
            return false;
        }

        const arunaModule = fs.readFileSync(module, 'utf8');
        const obj = await yaml.parse(arunaModule);

        return [obj.moduleInfo.enabled, obj.moduleInfo.name];
    }
}

module.exports = ModuleParser;
