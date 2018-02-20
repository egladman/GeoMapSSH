const fs = require('fs');
const lineReader = require('readline');
const path = require('path');
const express = require('express');
const geoip = require('geoip-lite');
const chalk = require('chalk');
const argv = require('yargs')
      .usage('Usage: $0 -p [num] -p [str]')
      .alias('h', 'help')
      .alias('l', 'log')
      .alias('p', 'port')
      .alias('d', 'debug')
      .argv;

let file, port, debug;
(argv.log) ? file = argv.log : file = "/var/log/auth.log";
(argv.port) ? port = argv.port : port = 8000;
(argv.debug) ? debug = true : debug = false;

if (!fs.existsSync(file)) {
    throw new Error(`File ${file} does not exist.`);
}

let geoJSON = {
    "type": "FeatureCollection",
    "features": []
};

const rl = lineReader.createInterface({
    input: fs.createReadStream(file)
});
rl.on('line', function (line) {
    if ( line.indexOf("Failed password") === 0 ) return; //Only look for failed password attempts

    let timeStamp, ipAddress, sshPort, userName;
    let arr = line.split(" ");

    let i = arr.indexOf('from');
    ipAddress = arr[i+1];

    let j = arr.indexOf('port');
    sshPort = arr[j+1];

    let k = arr.indexOf('for');
    userName = arr[k+1];

    timeStamp = "".concat(arr[0], " ", arr[1], " ", arr[2]); //Not the most elegant solution...

    let coordinates;
    let lookup = geoip.lookup(ipAddress);
    if (lookup === null) {
        _debug(`address lookup failed for ${ipAddress}`, 'warning');
        coordinates = [];
    } else {
        coordinates = lookup.ll.reverse();
    }

    let feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": coordinates
        },
        "properties": {
            "time": `${timeStamp} ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
            "ip": ipAddress,
            "user": userName,
            "port": sshPort
        }
    };
    geoJSON.features.push(feature);
});

//Routes
let app = express();
app.listen(port, () => console.log(`listening on localhost:${port}`));

app.get('/', function (req, res) {
    res.sendFile('index.html', { root: path.join(__dirname, '../public') });
});

app.get('/api/v1/ssh/attempts', function (req, res) {
    res.send(JSON.stringify(geoJSON));
});

//Helpers
function _debug(message, severity) {
    if (!debug) return;

    switch (severity) {
    case 'fatal':
        message = message.replace(/^/, chalk.red('FATAL: '));
        break;
    case 'warning':
        message = message.replace(/^/, chalk.yellow('WARNING: '));
        break;
    default:
        throw new Error(`severity: ${severity} is not supported.`)
    }
    console.log(message);
    if (severity === 'fatal') process.exit(1);
}
