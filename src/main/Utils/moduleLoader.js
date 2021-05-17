const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ModuleParser = require('./moduleParser');
const pkgJG = require('./packageJsonGenerator');
const pkg = require(path.resolve(__dirname, '..', '..', '..', 'package.json'));

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

                    if (aModule.requireCore > parseFloat(pkg.version)) {
                        const ver = `The ${aModule.name} module requires a higher version of the core (${aModule.requireCore}+). Please update your ArunaCore to run this module.`;
                        this.logger.error(ver);
                        return reject(ver);
                    }

                    var dependencies = '';
                    var devDependencies = '';

                    if (aModule.dependencies[0]) {
                        aModule.dependencies.forEach((element) => {
                            dependencies = dependencies + ` ${Object.entries(element)[0][0]}@${Object.entries(element)[0][1]}`;
                        });
                        delete aModule.dependencies;
                    }

                    if (aModule.devDependencies[0]) {
                        aModule.devDependencies.forEach((element) => {
                            devDependencies = devDependencies + ` ${Object.entries(element)[0][0]}@${Object.entries(element)[0][1]}`;
                        });
                        delete aModule.devDependencies;
                    }

                    await new pkgJG().gen(aModule, moduleDir.replace('.arunamodule', ''));

                    if (dependencies !== undefined) {
                        if (dependencies.startsWith(' ')) dependencies = dependencies.replace(' ', '');

                        this.logger.info(`Installing ${aModule.name} Dependencies...`);

                        await this.installDeps(dependencies, moduleDir.replace('.arunamodule', ''), false);
                    }

                    if (devDependencies !== undefined) {
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
                    this.logger.error(err);
                    return reject(err);
                });
        });
    }

    async installDeps(dependencies, moduleDir, isDev) {
        return new Promise((resolve, reject) => {
            var i;
    
            if (isDev) {
                i = spawn('npm', ['--save-dev', 'i', dependencies], { cwd: moduleDir });
            } else {
                i = spawn('npm', ['i', dependencies], { cwd: moduleDir });
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
}

module.exports = ModuleLoader;