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
const axios = require('axios');
const osLocale = require('os-locale');
const pkg = require(path.resolve(__dirname, '..', '..', '..', 'package.json'));
const { logger: LoggerC } = require(path.resolve(__dirname, '..', 'Utils'));
const approveAllRegex = /^.*\)\s*/gi;

var logger;
var language; // The language!
/**
 * Class for the installer
 */
class Installer {
    constructor() {
        this.version = pkg.version;
        this.language = osLocale.sync();
        logger = new LoggerC({ debug: true, prefix: 'INSTALLER' });
        this.gitURL = `https://github.com/ArunaBot/ArunaCore/releases/v${pkg.version}/download/`;
    }

    /**
     * Start Installer
     * @param {String} [languagePath] - path to language folder
     * @param {String} [configPath] - path to configuration folder
     * @return {Promise<Boolean>}
     */
    async start(configPath, languagePath) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            // Check if language folder exists
            if (!fs.existsSync(languagePath)) {
                await this.git(['submodule', 'update', '--init', '--force'], path.dirname(require.main.filename));
            }

            if (!fs.existsSync(path.resolve(languagePath, 'core', this.language, 'installer.json'))) {
                language = require(path.resolve(languagePath, 'core', 'en-US', 'installer.json'));
            } else {
                language = require(path.resolve(languagePath, 'core', this.language, 'installer.json'));
            }

            logger.info(language.class.start.messages.starting);
            logger.info(`${language.class.start.messages.version}: ${this.version}`);
            logger.info(`${language.class.start.messages.installerVersion}: 1.0.0`);
            logger.info(`${language.class.start.messages.OSLanguage}: ${this.language}`);
            

            // Check if configuration folder exists
            if (!fs.existsSync(configPath)) {
                logger.warn(language.class.start.errors.config.folder);
                var defaultConfigs;

                try {
                    logger.info(language.class.start.config.loading);
                    defaultConfigs = await this.loadConfig(path.resolve(__dirname, '..', '..', 'resources', 'defaultConfigs'));
                } catch (err) {
                    logger.debug(err);
                    logger.fatal(language.class.start.errors.config.fail);
                    return reject(language.class.start.errors.config.fail);
                }

                console.log(defaultConfigs);
            }
        });
    }


    /**
     * Check if language folder exists
     * @param {String} [languagePath] - path to language folder
     * @return {Boolean}
     */
    checkLanguagePath(languagePath = path.resolve(__dirname, '..', '..', '..', 'languages')) {
        try {
            return fs.existsSync(languagePath);
        } catch (e) {
            return false;
        }
    }

    /**
     * Check if configuration folder exists
     * @param {String} [configPath] - path to configuration folder
     * @return {Boolean}
     */
    checkConfigPath(configPath = path.resolve(__dirname, '..', '..', '..', 'config')) {
        try {
            return fs.existsSync(configPath);
        } catch (e) {
            return false;
        }
    }

    /**
     * Load default configuration yml files from path and return a object of objects
     * @param {String} [folderPath] - path to configuration folder
     * @return {Object}
     */
    async loadConfig(folderPath = path.resolve(__dirname, '..', '..', 'resources', 'defaultConfigs')) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            const yaml = require('yaml');
            const config = {};

            if (!folderPath || !fs.existsSync(folderPath)) {
                logger.error(language.class.loadCnfig.error.noPath);
                return reject(false);
            }

            try {
                const files = fs.readdirSync(folderPath);
                files.forEach((file) => {
                    if (file.endsWith('.yml')) {
                        const filePath = path.resolve(folderPath, file);
                        const fileContent = fs.readFileSync(filePath, 'utf8');
                        config[file.replace(/\.yml$/, '')] = yaml.parse(fileContent);
                    }
                });
            } catch (e) {
                logger.debug(e);
                logger.warn(language.class.start.errors.config.fail);
                return reject(false);
            }

            return resolve(config);
        });
    }

    /**
      * Get user imput from console
      * @param {String} [question] - question to ask
      * @param {String} [default] - default value
      * @param {Object} [validator] - regex validator to user imput
      * @return {Promise<String>}
      * 
      * @example
      * installer.getUserInput("What is your name?", "bryan", {validator: "/g/gi", warning: "My message"});
      * return "John Doe";
      */
    getUserInput(question, defaultValue, validator) {
        return new Promise((resolve, reject) => {
            if (!question) {
                logger.error(language.class.getUserInput.error.noQuestion);
                return reject(language.class.getUserInput.error.noQuestion); 
            }

            if (typeof(defaultValue) === 'object') {
                validator = defaultValue;
                defaultValue = null;
            }

            const prompt = require('prompt');
            prompt.start();

            prompt.get({
                description: `${question}${defaultValue ? ` (${defaultValue})` : ''}`,
                name: 'userInput',
                validator: validator ? validator.validator || approveAllRegex : approveAllRegex,
                warn: validator ? validator.warn || approveAllRegex : approveAllRegex,
            }, function (err, result) {
                if (err) { logger.error(err); return reject(err); }
                return resolve(result.userInput || defaultValue);
            });
        });
    }

    /**
     * Download required directories
     * @deprecated
     * @param {String} [path] - path to download
     * @param {String} [uri] - uri to download
     * @return {Promise<Boolean>}
     */
    async download(path, uri) {
        return new Promise((resolve, reject) => {
            axios.get(uri).then(response => {
                fs.writeFile(path, response.data, async (err) => {
                    if (err) {
                        logger.error(err);
                        return reject(false);
                    }

                    try {
                        logger.info(`${language.class.download.file.start} ` + path.replace('.zip', ''));
                        await this.extract(path, path.replace('.zip', ')'));
                        return resolve(true);
                    } catch (err) {
                        logger.error(err);
                        return reject(false);
                    }
                });
            }).catch(err => {
                logger.error(err);
                return reject(false);
            });
        });
    }

    /**
     * Create a method than extracts a zip using adm-zip module
     * @param {String} [zipPath] - path to zip
     * @param {String} [path] - path to extract
     * @return {Promise<Boolean>}
     */
    extract(zipPath, path) {
        return new Promise((resolve) => {
            const admZip = require('adm-zip');
            const zip = new admZip(zipPath);
            zip.extractAllTo(path, true);
            return resolve(true);
        });
    }

    /**
     * Execute "git" commands using spawn
     * @param {Array} [args] - command line arguments
     * @param {String} [cwd] - current working directory
     * @return {Promise<Pending>}
     */
    git(args, cwd) {
        return new Promise((resolve, reject) => {
            const git = require('child_process').spawn('git', args, { cwd: cwd });
            git.on('error', (err) => {
                logger.error(err);
                return reject(err);
            });
            git.on('close', (code) => {
                if (code !== 0) {
                    logger.error(language.class.git.error.fail);
                    return reject(code);
                }
                return resolve(true);
            });
        });
    }
}

module.exports = Installer;
