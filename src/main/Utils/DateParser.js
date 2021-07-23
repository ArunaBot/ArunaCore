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

function getTime() {
    var time = getTimeRaw();
    var separatedTime = time.split(':');
    separatedTime.forEach((element, index) => {
        if (element.length < 2) {
            separatedTime[index] = `0${separatedTime[index]}`;
        }
    });
    return separatedTime.join(':');
}

function getTimeRaw() {
    return `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;
}

module.exports = {
    getTime: getTime,
};
