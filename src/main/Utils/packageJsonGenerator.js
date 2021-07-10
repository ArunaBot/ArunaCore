const fs = require('fs');
const del = require('del');

class PackageJsonGenerator {
    gen(object, dir) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            try {
                if (fs.existsSync(dir + '.yarnrc')) {
                    const file = fs.readFileSync(dir + '.yarnrc');
                    if (!file.includes('--modules-folder')) {
                        fs.writeFileSync(dir + '.yarnrc', `${file}\n--modules-folder ${object.core.NODE_PATH}`);
                    }
                } else {
                    fs.writeFileSync(dir + '.yarnrc', `--modules-folder ${object.core.NODE_PATH}`);
                }

                delete object.core;

                if (fs.existsSync(dir + '.npmrc')) {
                    const file = fs.readFileSync(dir + '.npmrc');
                    if (!file.includes('engine-strict')) {
                        fs.writeFileSync(dir + '.npmrc', `${file}\nengine-strict = true`);
                    }
                } else {
                    fs.writeFileSync(dir + '.npmrc', 'engine-strict = true');
                }

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
