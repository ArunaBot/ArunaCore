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

const mysql = require('mysql');
const mongoose = require('mongoose');

/**
 * Database manager class.
 */
class DatabaseManager {
    constructor(logger, config) {
        this.logger = logger;
        this.type = config.type;
        this.host = config.host;
        this.port = config.port;
        this.database = config.database;
        this.username = config.username;
        this.password = config.password;
        this.mongoURI = config.mongoURI;
    }

    /**
     * Connect to the database.
     * @returns {Promise}
     * @throws {Error}
     */
    connect() {
        return new Promise((resolve, reject) => {
            this.logger.info(`Connecting to mysql database ${this.type}://${this.username}:${this.password}@${this.host}:${this.port}/${this.database}`);
            if (this.type === 'mysql') {
                const connection = mysql.createConnection({
                    host: this.host,
                    port: this.port,
                    user: this.username,
                    password: this.password,
                    database: this.database,
                    multipleStatements: true
                });

                connection.connect((err) => {
                    if (err) {
                        this.logger.error(`Error connecting to database ${this.type}://${this.username}:${this.password}@${this.host}:${this.port}/${this.database}`);
                        reject(new Error(err));
                    } else {
                        this.logger.info(`Connected to database ${this.type}://${this.username}:${this.password}@${this.host}:${this.port}/${this.database}`);
                        resolve(connection);
                    }
                });
                this.connection = connection;
            } else if (this.type === 'mongo') {
                const mongoUri = this.mongoURI || `mongodb://${this.username}:${this.password}@${this.host}:${this.port}/${this.database}`;
                mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
                    if (err) {
                        this.logger.error(`Error connecting to database ${mongoUri}`);
                        this.logger.error(JSON.stringify(err));
                        reject(new Error(err));
                    }
                });
                this.logger.info(`Connected to mongo database ${mongoUri}`);
                this.connection = mongoose;
                resolve(mongoose);
            }
        });
    }

    /**
     * Registers mongoose schemas.
     * @returns {Promise}
     * @throws {Error}
     */
    registerSchemas(schemas) {
        return new Promise((resolve, reject) => {
            if (!this.type !== 'mongo') {
                this.logger.error(`Cannot register schemas for ${this.type}`);
                return reject(new Error('Schemas can only be registered for mongo.'));
            }

            if (!schemas || schemas instanceof Array) {
                this.logger.error('Schemas must be an array of schema objects.');
                return reject(new Error('Schemas must be an array of schema objects.'));
            }

            this.logger.info('Registering mongoose schemas');

            var stopThis = false;

            const mongooseSchema = this.connection.Schema;

            schemas.forEach((schema) => {
                if (!schema.name || typeof schema.name !== 'string') {
                    this.logger.error('Schema name is required and must be a string.');
                    stopThis = true;
                    return reject(new Error('Schema name is required and must be a string.'));
                }

                if (!schema.model || typeof schema.model !== 'object') {
                    this.logger.error('Schema model is required and must be a object.');
                    stopThis = true;
                    return reject(new Error('Schema model is required and must be a object.'));
                }

                this.connection.model(schema.name, new mongooseSchema(schema.schema));
            });

            if (!stopThis) {
                resolve();
            }
        });
    }

    /**
     * Disconnect from the database.
     * @returns {Promise}
     * @throws {Error}
     */
    disconnect() {
        return new Promise((resolve, reject) => {
            this.logger.info(`Disconnecting from database ${this.type}://${this.username}:${this.password}@${this.host}:${this.port}/${this.database}`);
            if (this.type === 'mysql') {
                this.connection.end((err) => {
                    if (err) {
                        this.logger.error(`Error disconnecting from database ${this.type}://${this.username}:${this.password}@${this.host}:${this.port}/${this.database}`);
                        reject(new Error(err));
                    } else {
                        this.logger.info(`Disconnected from database ${this.type}://${this.username}:${this.password}@${this.host}:${this.port}/${this.database}`);
                        resolve();
                    }
                });
            } else if (this.type === 'mongo') {
                this.connection.disconnect();
                this.logger.info(`Disconnected from database ${this.type}://${this.username}:${this.password}@${this.host}:${this.port}/${this.database}`);
                resolve();
            }
        });
    }
}

module.exports = DatabaseManager;