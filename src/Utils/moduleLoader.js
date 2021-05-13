const fs = require('fs');
const path = require('path');
const pkgJG = require('./packageJsonGenerator');

class ModuleLoader {
    constructor(logger) {
        this.modules = [];
        this.toInstall = [];
        this.logger = logger;
    }

    async load(dir, done) {
        this.logger.info('Initializing Load...');
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
        return await walk(dir, done);
    }

    async install(module) {
        this.logger.info(`Installing Module: ${module}...`);
        return false;
        // await new pkgJG().gen(module);
    }
}

module.exports = ModuleLoader;