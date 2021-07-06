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

const path = require('path');
const axios = require('axios');

const pkg = require(path.resolve(__dirname, '..', '..', '..', 'package.json'));
const defaultHeaders = { 'User-Agent': 'ArunaCore/' + pkg.version };

class httpRequest {
    constructor(data) {
        this.protocol = data.protocol ? data.protocol : 'http';
        this.port = data.port ? data.port : this.protocol === 'https' ? 443 : 80;
        this.host = data.host;
        this.headers = data.headers ? data.headers : defaultHeaders;
    }

    get(path, data) {
        return new Promise((resolve, reject) => {
            if (!path) return reject('Please, provide a path!');

            const finalPath = this.base(data, path);
            const headers = data.headers ? data.headers : this.headers;

            if (data && data.params) {
                axios.get(finalPath, { headers: headers, params: data.params }).then(result => {
                    return resolve(result.data);
                }).catch(err => {
                    return reject(err);
                });
            } else {
                axios.get(finalPath, { headers: headers }).then(result => {
                    return resolve(result.data);
                }).catch(err => {
                    return reject(err);
                });
            }

        });
    }

    delete(path, data) {
        return new Promise((resolve, reject) => {
            if (!path) return reject('Please, provide a path!');

            const finalPath = this.base(data, path);
            const headers = data.headers ? data.headers : this.headers;

            if (data && data.params) {
                axios.delete(finalPath, { headers: headers, params: data.params }).then(result => {
                    return resolve(result.data);
                }).catch(err => {
                    return reject(err);
                });
            } else {
                axios.delete(finalPath, { headers: headers }).then(result => {
                    return resolve(result.data);
                }).catch(err => {
                    return reject(err);
                });
            }

        });
    }

    post(path, data) {
        return new Promise((resolve, reject) => {
            if (!path) return reject('Please, provide a path!');
            if (!data || !data.params) return reject('Please, provide a params!');

            const finalPath = this.base(data, path);
            const headers = data.headers ? data.headers : this.headers;

            axios.post(finalPath, data.params, { headers: headers }).then(result => {
                return resolve(result.data);
            }).catch(err => {
                return reject(err);
            });
        });
    }

    put(path, data) {
        return new Promise((resolve, reject) => {
            if (!path) return reject('Please, provide a path!');
            if (!data || !data.params) return reject('Please, provide a params!');

            const finalPath = this.base(data, path);
            const headers = data.headers ? data.headers : this.headers;

            axios.put(finalPath, data.params, { headers: headers }).then(result => {
                return resolve(result.data);
            }).catch(err => {
                return reject(err);
            });
        });
    }

    patch(path, data) {
        return new Promise((resolve, reject) => {
            if (!path) return reject('Please, provide a path!');
            if (!data || !data.params) return reject('Please, provide a params!');

            const finalPath = this.base(data, path);
            const headers = data.headers ? data.headers : this.headers;

            axios.patch(finalPath, data.params, { headers: headers }).then(result => {
                return resolve(result.data);
            }).catch(err => {
                return reject(err);
            });
        });
    }

    base(data, path) {
        var finalPort;
        var finalHost;
        var finalProtocol;
        var finalPath;

        if (path.startsWith('http')) {
            finalPath = path;
        } else if (data && data instanceof Object) {
            finalPort = data.port ? data.port : this.port;
            finalHost = data.host ? data.host : this.host;
            finalProtocol = data.protocol ? data.protocol : this.protocol;

            finalPath = finalProtocol + '://' + finalHost + ':' + finalPort + '/' + path;
        } else {
            finalPort = this.port;
            finalHost = this.host;
            finalProtocol = this.protocol;

            finalPath = finalProtocol + '://' + finalHost + ':' + finalPort + '/' + path;
        }

        return finalPath;
    }
}

module.exports = httpRequest;
