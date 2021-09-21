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
const { spawn } = require('child_process');
const ModuleParser = require('./moduleParser');
const ModuleManager = require('./moduleManager');
const pkg = require(path.resolve(__dirname, '..', '..', '..', 'package.json'));
const pkgJG = require(path.resolve(__dirname, '..','Utils', 'packageJsonGenerator'));

class ModuleLoader {
    constructor(logger) {
        this.modules = [];
        this.toInstall = [];
        this.logger = logger;
    }

    async load(dir) {
        this.logger.info('Initializing Load...');
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            var walk = async function(dir, done) {
                var results = [];
                fs.readdir(dir, function(err, list) {
                    if (err) return done(err);
                    var pending = list.length;
                    if (!pending) return done(null, results);
                    list.forEach(function(file) {
                        file = path.resolve(dir, file);
                        fs.stat(file, function(err, stat) {
                            if (stat && stat.isDirectory()) {
                                walk(file, function(err, res) {
                                    results = results.concat(res);
                                    if (!--pending) done(null, results);
                                });
                            } else {
                                if (file.includes('.arunamodule') || file.includes('.moduleList')) {
                                    results.push(file);
                                }
                                if (!--pending) done(null, results);
                            }
                        });
                    });
                });
            };

            await walk(dir, function (err, results) {
                if (err) return reject(err);
                
                return resolve(results);
            });
        });
    }

    async install(moduleDir, moduleList) {
        const parser = new ModuleParser(this.logger);
        return new Promise((resolve, reject) => {
            parser.parser(moduleDir)
                .then(async (aModule) => {
                    this.logger.info(`Installing Module: ${aModule.name}...`);

                    if (aModule.requireCore && !semver.satisfies(pkg.version, aModule.requireCore)) {
                        const ver = `The ${aModule.name} module requires a higher version of the core (${semver.minVersion(aModule.requireCore)}+). ` + 
                        'Please upgrade your ArunaCore to run this module.';
                        this.logger.warn(ver);
                        return reject(ver);
                    }

                    delete aModule.requireCore;

                    var dependencies = '';
                    var devDependencies = '';

                    if (aModule.dependencies && aModule.dependencies[0]) {
                        aModule.dependencies.forEach((element) => {
                            dependencies = dependencies + ` ${Object.entries(element)[0][0]}@${Object.entries(element)[0][1]}`;
                        });
                        delete aModule.dependencies;
                    }

                    if (aModule.devDependencies && aModule.devDependencies[0]) {
                        aModule.devDependencies.forEach((element) => {
                            devDependencies = devDependencies + ` ${Object.entries(element)[0][0]}@${Object.entries(element)[0][1]}`;
                        });
                        delete aModule.devDependencies;
                    }

                    await new pkgJG().gen(aModule, moduleDir.replace('.arunamodule', ''));

                    if (dependencies !== undefined && dependencies !== '') {
                        if (dependencies.startsWith(' ')) dependencies = dependencies.replace(' ', '');

                        this.logger.info(`Installing ${aModule.name} Dependencies...`);

                        await this.installDeps(dependencies, moduleDir.replace('.arunamodule', ''), false);
                    }

                    if (devDependencies !== undefined && devDependencies !== '') {
                        if (devDependencies.startsWith(' ')) devDependencies = devDependencies.replace(' ', '');

                        this.logger.info(`Installing ${aModule.name} Dev Dependencies...`);

                        await this.installDeps(devDependencies, moduleDir.replace('.arunamodule', ''), true);
                    }

                    var file = fs.readFileSync(moduleList);

                    file = JSON.parse(file);

                    file[aModule.name] = moduleDir;

                    fs.writeFileSync(moduleList, JSON.stringify(file));
                    
                    resolve(moduleDir);
                }).catch((err) => {
                    this.logger.error(JSON.stringify(err));
                    return reject(JSON.stringify(err));
                });
        });
    }

    async installDeps(dependencies, moduleDir, isDev) {
        return new Promise((resolve, reject) => {
            var i;

            if (isDev) {
                i = spawn('yarn', ['add', '--dev', dependencies], { cwd: moduleDir });
            } else {
                i = spawn('yarn', ['add', dependencies], { cwd: moduleDir });
            }
                            
            i.on('error', (error) => {
                console.log(`error: ${error.message}`);
                reject(error.message);
            });
                            
            i.on('close', code => {
                if (code === 0) return resolve();
                return reject('Error!');
            });
        });
    }

    /**
     * Start the module.
     * @param {Array} [modules]
     * @param {Object} [webSocketProperties]
     * @returns {Promise}
     */
    async start(modules, webSocketProperties, debug) {
        this.logger.info('Starting Modules...');
        const moduleManager = new ModuleManager(debug);
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            for (var i = 0; i < modules.length; i++) {
                this.logger.info(`Starting Module: ${modules[i]}...`);
                // eslint-disable-next-line no-await-in-loop
                await moduleManager.start(modules[i], webSocketProperties);
            }

            resolve(moduleManager);
        });
    }
}

module.exports = ModuleLoader;
