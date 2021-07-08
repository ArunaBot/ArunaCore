const fs = require('fs');
const del = require('del');

class PackageJsonGenerator {
    constructor () {
    }

    gen(object, dir) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            try {
                fs.unlinkSync(dir + 'package.json');
                fs.unlinkSync(dir + 'package-lock.json');

                del.sync(dir + '/node_modules/');
            } catch {

            } finally {
                fs.writeFileSync(dir + 'package.json', JSON.stringify(object), { flag: 'a+', encoding: 'utf8' });
                resolve();
            }
        });    
    }
}

module.exports = PackageJsonGenerator;