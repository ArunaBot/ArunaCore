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
const WebSocket = require('ws');
const semver = require('semver');
const EventEmitter = require('events');
const { logger: LoggerC } = require(path.resolve(__dirname,'Utils'));
const pkg = require(path.resolve(__dirname, '..', '..', 'package.json'));
const WebSocketServer = require(path.resolve(__dirname, 'WebSocket', 'server'));
const { ModuleLoader, ModuleParser } = require(path.resolve(__dirname,'moduleManager'));

var logger;
var args;

class Main extends EventEmitter {
    constructor() {
        super();
        this.debug = true;
        logger = new LoggerC({ debug: this.debug, prefix: 'CORE' });
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

        var toInstall = load.filter((element) => !installedModules.includes(element));

        logger.debug(`Non Installed Modules: ${JSON.stringify(toInstall)}.`);

        if (toInstall.length > 0) {
            for (let i = 0; i <= toInstall.length; i++) {
                var element = toInstall[i];

                if (!element) return;

                // eslint-disable-next-line no-await-in-loop
                await loader.install(element, moduleList).then(() => {
                    toInstall.splice(i, 1);
                    toLoad.push(element);
                }).catch((e) => {
                    logger.debug(JSON.stringify(e));
                    logger.error(`Unable to install the module present in the '${element.replace('.arunamodule', '')}' directory, skipping ...`);
                });
            }
        }
        
        if (toLoad.length == 0) {
            logger.error('No Modules to Load! Shutting Down...');
            return process.exit(0);
        }

        logger.info('Getting Enabled Modules...');

        for (let i = 0; i + 1 <= toLoad.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            await parser.isModuleEnabled(toLoad[i]).then(async ([isEnabled, name]) => {
                if (!isEnabled) {
                    toLoad.splice(i, 1);
                    i--;
                }

                logger.info(`Pre-Loading Module: ${name}...`);

                if (!fs.existsSync(toLoad[i].replace('.arunamodule', '') + 'package.json') ||
                    !fs.existsSync(toLoad[i].replace('.arunamodule', '') + 'yarn.lock')) {
                    await loader.install(toLoad[i], moduleList).then(() => {
                        logger.info(`Pre-Loaded Module: ${name}!`);
                    }).catch((e) => {
                        logger.debug(e);
                        logger.error(`Unable to install the module present in the '${toLoad[i].replace('.arunamodule', '')}' directory, skipping initialization ...`);
                        toLoad.splice(i, 1);
                        i--;
                    });
                } else {
                    logger.info(`Pre-Loaded Module: ${name}!`);
                }
            }).catch((e) => {
                logger.debug(JSON.stringify(e));
                logger.error(`Unable to enable the module present in the '${toLoad[i].replace('.arunamodule', '')}' directory, skipping ...`);
                toLoad.splice(i, 1);
                i--;
            });
        }

        if (toLoad.length == 0) {
            logger.error('No Modules to Load! Shutting Down...');
            return process.exit(0);
        }

        logger.info('Initializing WebSocket Server...');

        const wss = new WebSocketServer(this.debug, process.env.PORT || 3000);

        const wsParser = await wss.start();

        this.wsParser = wsParser;

        const coreWS = new WebSocket(`ws://localhost:${process.env.PORT || 3000}`);

        this.coreWS = coreWS;

        coreWS.on('open', () => {
            coreWS.send(':CORE 000 W.S.S. :EnableWS');
        });

        coreWS.on('message', (message) => {
            if (message === ':W.S.S. 001 CORE :Welcome to ArunaCore!') {
                this.continue = true;
                return logger.info('WebSocket Server Started!');
            } else {
                return this.webSocketMessageHandler(message);
            }
        });

        await this.waiter(false);

        logger.info('Core Started!');

        const moduleManager = await loader.start(toLoad, { port: process.env.PORT || 3000, host: 'localhost'});
        this.moduleManager = moduleManager;

        var total = toLoad.length;

        moduleManager.on('moduleStart', (moduleName) => {
            this.loaded.push(moduleName);
            total--;
            if (total == 0) {
                logger.info('All Modules Started!');
                this.continue = true;
            }
        });

        await this.waiter(false);

        this.emit('ready', null);
    }

    webSocketMessageHandler(rawMessage) {
        if (!rawMessage) return;

        const message = this.wsParser.parser(rawMessage);

        if (!message || typeof message !== 'object') return;

        switch (message.command) {
            case '011':
                break;
            case '010':
                this.moduleManager.emit('WaitWS', message.who, true);
                break;
            default:
                break;
        }

    }

    /**
     * Stops the core, websocket and all modules.
     */
    async stop() {
        this.logger.warn('Stopping modules...');
        this.moduleManager.emit('stop', 'all');
        this.moduleManager.on('finishedAll', () => {
            this.logger.warn('All modules stopped!');
            this.continue = true;
        });

        await this.waiter(false);

        this.logger.warn('Stopping WebSocket Server...');
        this.coreWS.send(':CORE 000 W.S.S. :DisableWS');
        this.coreWS.on('message', (message) => {
            if (message === ':W.S.S. 002 CORE :Goodbye, ArunaCore!') {
                this.continue = true;
                return this.logger.warn('WebSocket Server Stopped!');
            }
        });

        await this.waiter(false);

        this.logger.info('Goodbye, I see you soon! :)');
    }

    async waiter(bool) {
        if (bool) this.continue = bool;
        if (this.continue) return;

        await new Promise((resolve) => {
            setTimeout(() => {
                this.waiter();
                resolve();
            }, 1000);
        });
    }
}

const main = new Main();

main.start();

