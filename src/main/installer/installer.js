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
const yaml = require('yaml');
const axios = require('axios');
const osLocale = require('os-locale');
const pkg = require(path.resolve(__dirname, '..', '..', '..', 'package.json'));
const { logger: LoggerC } = require(path.resolve(__dirname, '..', 'Utils'));
const approveAllRegex = /(.*)/gi;

var logger;
var language; // The language!

/**
 * Class for the installer
 */
class Installer {
    constructor() {
        this.version = pkg.version;
        this.language = osLocale.sync();
        this.prefix = 'INSTALLER';
        logger = new LoggerC({ debug: true, prefix: this.prefix });
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
                    this.stop = true;
                    return reject(language.class.start.errors.config.fail);
                }
            } else {
                return resolve();
            }

            if (this.stop) return;

            const config = defaultConfigs.arunacore;

            var numberOfValues = 0;

            function GetAllConfigs(object) {       
                Object.values(object).forEach((values) => {
                    if (typeof(values) === 'object') {
                        GetAllConfigs(values);
                    } else {
                        numberOfValues++;
                    }
                });
            }

            GetAllConfigs(config);

            var numberOfQuestions = numberOfValues;
            var actualQuestion = 1;

            if ((await this.getUserInput(language.class.start.questions.arunacore.debug.question, language.generic.no.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
                { validator: 
                    // eslint-disable-next-line max-len
                    new RegExp(`${language.generic.yes.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}|${language.generic.no.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`, 'gi'),
                warn: language.class.start.questions.arunacore.debug.warn
                },
                `${language.generic.question} ${actualQuestion}/${numberOfQuestions}`)).includes(language.generic.yes.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {

                config.arunacore.debug = true;
            }

            actualQuestion++;

            var response = await this.getUserInput(language.class.start.questions.arunacore.prefix.question,
                defaultConfigs.arunacore.arunacore.prefix,
                `${language.generic.question} ${actualQuestion}/${numberOfQuestions}`);

            response !== defaultConfigs.arunacore.arunacore.prefix ? config.arunacore.prefix = response : config.arunacore.prefix = defaultConfigs.arunacore.arunacore.prefix;
            actualQuestion++;

            if ((await this.getUserInput(language.class.start.questions.websocket.debug.question, language.generic.no.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
                { validator: 
                    // eslint-disable-next-line max-len
                    new RegExp(`${language.generic.yes.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}|${language.generic.no.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`, 'gi'),
                warn: language.class.start.questions.websocket.debug.warn
                },
                `${language.generic.question} ${actualQuestion}/${numberOfQuestions}`)).includes(language.generic.yes.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {

                config.websocket.debug = true;
            }

            actualQuestion++;

            response = await this.getUserInput(language.class.start.questions.websocket.prefix.question,
                defaultConfigs.arunacore.websocket.prefix,
                `${language.generic.question} ${actualQuestion}/${numberOfQuestions}`);

            response !== defaultConfigs.arunacore.websocket.prefix ? config.websocket.prefix = response : config.websocket.prefix = defaultConfigs.arunacore.websocket.prefix;

            actualQuestion++;

            response = await this.getUserInput(language.class.start.questions.websocket.port.question,
                defaultConfigs.arunacore.websocket.port,
                { validator: /^([1-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/g, warn: language.class.start.questions.websocket.port.warn },
                `${language.generic.question} ${actualQuestion}/${numberOfQuestions}`);

            response !== defaultConfigs.arunacore.websocket.port ? config.websocket.port = response : config.websocket.port = defaultConfigs.arunacore.websocket.port;

            actualQuestion++;

            response = await this.getUserInput(language.class.start.questions.websocket.host.question,
                defaultConfigs.arunacore.websocket.host,
                `${language.generic.question} ${actualQuestion}/${numberOfQuestions}`);

            response !== defaultConfigs.arunacore.websocket.host ? config.websocket.host = response : config.websocket.host = defaultConfigs.arunacore.websocket.host;

            actualQuestion++;

            if ((await this.getUserInput(language.class.start.questions.http.enable.question, language.generic.yes.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
                { validator: 
                    // eslint-disable-next-line max-len
                    new RegExp(`${language.generic.yes.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}|${language.generic.no.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`, 'gi'),
                warn: language.class.start.questions.http.enable.warn
                },
                `${language.generic.question} ${actualQuestion}/${numberOfQuestions}`)).includes(language.generic.no.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {

                config.http.enabled = false;
            }

            actualQuestion++;

            if (config.http.enabled) {
                if ((await this.getUserInput(language.class.start.questions.http.debug.question, language.generic.no.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
                    { validator: 
                    // eslint-disable-next-line max-len
                    new RegExp(`${language.generic.yes.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}|${language.generic.no.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`, 'gi'),
                    warn: language.class.start.questions.http.debug.warn
                    },
                    `${language.generic.question} ${actualQuestion}/${numberOfQuestions}`)).includes(language.generic.yes.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {

                    config.http.debug = true;
                }

                actualQuestion++;
            } else {
                actualQuestion++;
            }

            if (config.http.enabled) {
                response = await this.getUserInput(language.class.start.questions.http.prefix.question,
                    defaultConfigs.arunacore.http.prefix,
                    `${language.generic.question} ${actualQuestion}/${numberOfQuestions}`);
    
                response !== defaultConfigs.arunacore.http.prefix ? config.http.prefix = response : config.http.prefix = defaultConfigs.arunacore.http.prefix;

                actualQuestion++;
            } else {
                actualQuestion++;
            }

            if (config.http.enabled) {
                response = await this.getUserInput(language.class.start.questions.http.port.question,
                    defaultConfigs.arunacore.http.port,
                    { validator: /^([1-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/g, warn: language.class.start.questions.http.port.warn },
                    `${language.generic.question} ${actualQuestion}/${numberOfQuestions}`);
    
                response !== defaultConfigs.arunacore.http.port ? config.http.port = response : config.http.port = defaultConfigs.arunacore.http.port;

                actualQuestion++;
            } else {
                actualQuestion++;
            }

            if (config.http.enabled) {
                response = await this.getUserInput(language.class.start.questions.http.host.question,
                    defaultConfigs.arunacore.http.host,
                    `${language.generic.question} ${actualQuestion}/${numberOfQuestions}`);

                response !== defaultConfigs.arunacore.http.host ? config.http.host = response : config.http.host = defaultConfigs.arunacore.http.host;

                actualQuestion++;
            } else {
                actualQuestion++;
            }

            if ((await this.getUserInput(language.class.start.questions.modules.debug.question, language.generic.no.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
                { validator: 
                    // eslint-disable-next-line max-len
                    new RegExp(`${language.generic.yes.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}|${language.generic.no.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`, 'gi'),
                warn: language.class.start.questions.modules.debug.warn
                },
                `${language.generic.question} ${actualQuestion}/${numberOfQuestions}`)).includes(language.generic.yes.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {

                config.modules.debug = true;
            }

            if (actualQuestion != numberOfQuestions) {
                logger.error(language.class.start.errors.fatal.invalidQuestionNumber.replace('%s', numberOfQuestions).replace('%s', actualQuestion));
                logger.fatal(language.class.start.errors.fatal.invalidQuestionNumber.replace('%s', numberOfQuestions).replace('%s', actualQuestion));
                return reject(language.class.start.errors.fatal.invalidQuestionNumber.replace('%s', numberOfQuestions).replace('%s', actualQuestion));
            }

            logger.info(language.class.start.messages.generating);
            
            fs.mkdirSync(configPath, { recursive: true });
            fs.writeFile(configPath + '/arunacore.yml', yaml.stringify(config), (err) => {
                if (err) {
                    logger.debug(err);
                    logger.error(language.class.start.errors.fatal.writeConfigFile.replace('%s', configPath + '/arunacore.yml').replace('%s', JSON.stringify(err)));
                    logger.fatal(language.class.start.errors.fatal.writeConfigFile.replace('%s', configPath + '/arunacore.yml').replace('%s', JSON.stringify(err)));
                    return reject(language.class.start.errors.fatal.writeConfigFile.replace('%s', configPath + '/arunacore.yml').replace('%s', JSON.stringify(err)));
                }
                logger.info(language.class.start.success.configFileWritten.replace('%s', configPath + '/arunacore.yml'));
                logger.info(language.class.start.success.message);
                return resolve(config);
            });
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
      * @param {String} [title] - title of the question
      * @return {Promise<String>}
      * 
      * @example
      * installer.getUserInput("What is your name?", "bryan", {validator: "/g/gi", warning: "My message"});
      * return "John Doe";
      */
    getUserInput(question, defaultValue, validator, title) {
        return new Promise((resolve, reject) => {
            if (!question) {
                logger.error(language.class.getUserInput.error.noQuestion);
                return reject(language.class.getUserInput.error.noQuestion); 
            }

            if (typeof(defaultValue) === 'object') {
                title = validator;
                validator = defaultValue;
                defaultValue = null;
            }

            if (typeof(validator) === 'string') {
                title = validator;
                validator = null;
            }

            const prompt = require('prompt');
            prompt.message = title.charAt(0).toUpperCase() + title.slice(1) || this.prefix;
            prompt.start();

            prompt.get({
                description: `${question.charAt(0).toUpperCase() + question.slice(1)}${defaultValue ? ` (${defaultValue})` : ''}`,
                name: 'userInput',
                validator: validator ? validator.validator || approveAllRegex : approveAllRegex,
                warn: validator ? validator.warn || approveAllRegex : approveAllRegex,
            }, function (err, result) {
                if (err) {
                    logger.error(err);
                    return reject(err);
                }

                logger.info(`${language.class.getUserInput.messages.result}: ${result.userInput || defaultValue}`);
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
