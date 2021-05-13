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
const EventEmitter = require('events');
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
        var parser;

        await loader.load(path.resolve(__dirname,'modules'), async function(err, results) {
            if (err) throw err;
            console.log(results);
            var moduleList;

            await results.forEach((element, index) => {
                if (element.includes('.moduleList')) {
                    results.splice(index, 1);
                    return moduleList = element;
                }
            });

            if (!moduleList) {
                logger.debug('Here');
                moduleList = path.resolve(__dirname,'modules', '.moduleList');
                try {
                    fs.writeFileSync(moduleList, '{}', { flag: 'a+', encoding: 'utf8' });
                } finally {
                    logger.info(`".moduleList" file created in '${moduleList.replace('.moduleList', '')}'.`);
                }
                
            }

            parser = new ModuleParser(logger, moduleList);

            const installedModules = await parser.getInstalledModules();

            logger.debug(`Installed Modules: ${JSON.stringify(installedModules)}.`);
            logger.debug(`All Modules (DIR): ${JSON.stringify(results)}.`);

            results = results.filter((element) => !installedModules.includes(element));

            logger.debug(`Non Installed Modules: ${JSON.stringify(results)}.`);

            await results.forEach(async (element) => {
                await loader.install(element);
            });

            logger.info('Getting Enabled Modules and Finishing Core Initialization...');
        });
    }
}

new Main().start();