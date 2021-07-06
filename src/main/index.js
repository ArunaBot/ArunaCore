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

const fs = require('fs');
const path = require('path');
const semver = require('semver');
const EventEmitter = require('events');
const pkg = require(path.resolve(__dirname, '..', '..', 'package.json'));
const { logger: LoggerC, ModuleLoader, ModuleParser } = require(path.resolve(__dirname,'Utils'));

var logger;
var args;

class Main extends EventEmitter {
    constructor() {
        super();
        logger = new LoggerC({ debug: true, prefix: 'CORE' });
    }

    async start() {
        logger.debug('Hello World!');
        logger.info('Starting Core Initialization...');

        if (!semver.satisfies(process.version, pkg.engines.node)) {
            logger.fatal(`Invalid node version! Please use a version that complies with the following standard: ${pkg.engines.node}`);
        }

        args = process.argv.slice(2);

        if (args[0]) {
            switch (args[0]) {
                case 'installer':
                case 'install':
                    break;
                default:
                    logger.error('Oops...');
                    logger.debug(args);
                    break;
            }
            return;
        }

        const loader = new ModuleLoader(logger);
        const parser = new ModuleParser(logger);
        
        var moduleList;

        var load = await loader.load(path.resolve(__dirname,'modules')).catch((err) => {
            logger.error('Fail on load modules!');
            logger.fatal(err);
        });

        load.forEach((element, index) => {
            if (element.includes('.moduleList')) {
                load.splice(index, 1);
                return moduleList = element;
            }
        });

        if (!moduleList) {
            moduleList = path.resolve(__dirname,'modules', '.moduleList');
            try {
                fs.writeFileSync(moduleList, '{}', { flag: 'a+', encoding: 'utf8' });
            } finally {
                logger.info(`".moduleList" file created in '${moduleList.replace('.moduleList', '')}'.`);
            }
                
        }

        const installedModules = await parser.getInstalledModules(moduleList);

        logger.debug(`Installed Modules: ${JSON.stringify(installedModules)}.`);
        logger.debug(`All Modules (DIR): ${JSON.stringify(load)}.`);

        var toLoad = installedModules;

        load = load.filter((element) => !installedModules.includes(element));

        logger.debug(`Non Installed Modules: ${JSON.stringify(load)}.`);

        if (load.length > 0) {
            for (var i = 0; i <= load.length; i++) {
                var element = load[i];

                if (!element) return;

                // eslint-disable-next-line no-await-in-loop
                await loader.install(element, moduleList).then(() => {
                    load.splice(i, 1);
                    toLoad.push(element);
                }).catch(() => {
                    logger.error(`Unable to install the module present in the '${element.replace('.arunamodule', '')}' directory, skipping ...`);
                });
            }
        }
        
        if (toLoad.length == 0) {
            logger.error('No Modules to Load! Shutting Down...');
            return process.exit(-1);
        }

        logger.info('Getting Enabled Modules and Finishing Core Initialization...');
    }
}

new Main().start();