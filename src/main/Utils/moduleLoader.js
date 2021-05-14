const fs = require('fs');
const path = require('path');
const ModuleParser = require('./moduleParser');
const pkgJG = require('./packageJsonGenerator');

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
                                if (
                                    file.includes('.arunamodule') ||
                                file.includes('package.json') ||
                                file.includes('.moduleList')
                                ) {
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

    async install(moduleDir) {
        const parser = new ModuleParser(this.logger);
        // eslint-disable-next-line no-async-promise-executor
        return new Promise((resolve, reject) => {
            parser.parser(moduleDir)
                .then((aModule) => {
                    this.logger.info(`Installing Module: ${aModule.name}...`);
                    // await new pkgJG().gen(module);
                    // reject('Not Implemented!');
                    resolve(moduleDir);
                })
                .catch((err) => {
                    this.logger.error(err);
                    return reject(err);
                });
        });
    }
}

module.exports = ModuleLoader;