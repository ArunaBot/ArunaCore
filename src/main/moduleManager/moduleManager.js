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
const yaml = require('yaml');
const path = require('path');
const EventEmitter = require('events');
const { logger: LoggerC } = require(path.resolve(__dirname, '..', 'Utils'));

/**
 * Module Manager
 */
class ModuleManager extends EventEmitter {
    constructor(debug) {
        super();
        this.debug = debug ? debug : false;
        this.modules = {};
        this.logger = new LoggerC({ debug: this.debug, prefix: 'ModuleManager'});
        this.redefine = (moduleList) => { this.modules = moduleList; };
    }

    /**
     * Start module and put it in the list of modules
     * @param {String} [moduleDir]
     * @return {Promise}
     */
    start(moduleDir) {
        return new Promise((resolve, reject) => {
            if (!moduleDir) {
                this.logger.error('moduleDir is not provided!');
                return reject('moduleDir is not provided!');
            }

            const arunaModule = fs.readFileSync(moduleDir, 'utf8');
            const aModule = yaml.parse(arunaModule);
            const moduleName = aModule.moduleInfo.name;

            if (this.modules[moduleName]) {
                this.logger.error(`The module ${moduleName} is already started!`);
                return reject(`The module ${moduleName} is already started!`);
            }

            this.moduleStart(moduleDir.replace('.arunamodule', '')).then(() => {
                this.logger.info(`Module ${moduleName} started!`);
                this.emit('moduleStart', moduleName);
                return resolve(moduleName);
            }).catch(err => {
                this.logger.error(`Module ${moduleName} failed to start: ${JSON.stringify(err)}`);
                return reject(err);
            });
        });
    }

    /**
     * Start module using yarn
     * @param {String} [moduleDir]
     * @return {Promise}
     */
    async moduleStart(moduleDir) {
        const runningModules = this.modules;

        const redefine = this.redefine;

        function deleteModule(moduleName) {
            delete runningModules[moduleName];
            redefine(runningModules);
        }
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            if (!moduleDir) {
                this.logger.error('moduleDir is not provided!');
                return reject('moduleDir is not provided!');
            }

            const packageJson = require(path.resolve(moduleDir, 'package.json'));
            if (!packageJson.scripts.start) {
                this.logger.error(`${moduleDir} does not have a start script`);
                return reject(`${moduleDir} does not have a start script`);
            }

            var sucess = true;
            var finished = false;

            this.logger.info(`Module ${packageJson.name} is starting...`);

            const child = require('child_process').spawn('yarn', ['start'], { cwd: moduleDir });

            child.stdout.on('data', (data) => {
                console.log(data.toString());
            });

            child.stderr.on('data', (data) => {
                console.error(data.toString());
            });

            child.on('close', (code) => {
                finished = true;
                if (child.killed) return;
                if (code === 0) {
                    this.logger.warn(`Module ${packageJson.name} finished!`);
                } else {
                    sucess = false;
                    this.logger.error(`Module ${packageJson.name} finished with code ${code}...`, code);
                }

                this.emit('moduleFinished', { name: packageJson.name, finishCode: code});

                const timeout = setTimeout(() => {
                    if (code != 0) {
                        this.logger.warn(`Restarting module ${packageJson.name}...`);
                        this.logger.debug(`Restarting module ${packageJson.name}, finished with code ${code}...`);
                    } else {
                        this.continue = true;
                        deleteModule(packageJson.name);
                        this.logger.info(`Module ${packageJson.name} is finished!`);
                        this.logger.debug(`Module ${packageJson.name} is finished with code ${code}...`);
                    }
                }, 5000);

                this.on('forceReload', listener);

                function listener(bool) {
                    clearTimeout(timeout);
                    if (bool) {
                        if (!finished) {
                            child.kill('SIGINT');
                        }
                        finished = false;
                        deleteModule(packageJson.name);
                        this.logger.warn(`Restarting module ${packageJson.name}...`);
                        this.logger.debug(`Restarting module ${packageJson.name}, finished with code ${code}...`);
                    }

                    finished = true;
                    this.logger.info(`Module ${packageJson.name} is finished!`);
                    this.logger.debug(`Module ${packageJson.name} is finished with code ${code}...`);
                }
            });

            this.on('WaitWS', (moduleName, stats) => {
                if (moduleName === packageJson.name) {
                    this.continue = true;
                    this.logger.debug(`Module ${packageJson.name} is ready...`, stats);

                    if (stats) {
                        this.logger.info(`Module ${packageJson.name} is ready and conncted with WebSocket.`);
                    } else {
                        this.logger.info(`Module ${packageJson.name} is ready but not connected with WebSocket.`);
                        this.logger.warn(`Module ${packageJson.name} do not have a WebSocket endpoint.`);
                    }
                }
            });

            const timeout2 = setTimeout(() => {
                this.continue = true;
                if (sucess && !finished) {
                    this.logger.info(`Module ${packageJson.name} is ready but not connected with WebSocket.`);
                    this.logger.warn(`Module ${packageJson.name} do not have a WebSocket endpoint.`);
                } else {
                    if (!finished) {
                        child.kill('SIGINT');
                    }
                    this.logger.error(`Module ${packageJson.name} failed to start...`);
                }
            }, 120000);

            await this.waiter(false);

            clearTimeout(timeout2);
            if (sucess) {
                resolve();
                this.modules[packageJson.name] = child;
            } else {
                reject();
            }

            this.on('stop', (moduleName) => {
                if (!moduleName) return;
                if (moduleName === 'all') {
                    Object.keys(this.modules).forEach(([key]) => {
                        this.modules[key].kill('SIGINT');
                        deleteModule(packageJson.name);
                    });
                    this.emit('finishedAll', null);
                }
            });

            this.on('forceReload', (bool) => {
                if (bool) {
                    if (!finished) {
                        child.kill('SIGINT');
                    }
                    finished = false;
                    this.logger.warn(`Restarting module ${packageJson.name}...`);
                }

                finished = true;
                this.logger.info(`Module ${packageJson.name} finished!`);
            });
        });
    }

    /**
     * Get module status
     * @param {String} moduleName
     * @return {Promise<Boolean>}
     */
    moduleStatus(moduleName) {
        return new Promise((resolve, reject) => {
            if (!moduleName) {
                this.logger.error('moduleName is not provided!');
                return reject('moduleName is not provided!');
            }

            if (this.modules[moduleName]) {
                return resolve(true);
            } else {
                return resolve(false);
            }
        });
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

module.exports = ModuleManager;
