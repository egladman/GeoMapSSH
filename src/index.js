const fs = require('fs');
const lineReader = require('readline');
const path = require('path');
const express = require('express');
const geoip = require('geoip-lite');
const Utils = require('./utils');
const argv = require('yargs')
      .usage('Usage: $0 -p [num] -p [str]')
      .alias('h', 'help')
      .alias('l', 'log')
      .alias('p', 'port')
      .argv;

let utils = new Utils();

let session = {
    default: {
        lastLineRead: -1,
        log: '/var/log/auth.log',
        port: 8000,
	apiVersion: 'v1',
	timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	meta: {
	    lastModified: Math.floor(Date.now() / 1000) // Epoch time
	}
    },
    current: {
        // This object is dynamically built
    }
};
Object.freeze(session.default); // Guarantees no funny business

if (typeof session.current.lastLineRead === 'undefined') session.current.lastLineRead = session.default.lastLineRead;

(argv.log) ? session.current.log = argv.log : session.current.log = session.default.log;
(argv.port) ? session.current.port = argv.port :  session.current.port = session.default.port;

if (!fs.existsSync(session.current.log)) { // Sanity Check
    throw new Error(`File ${session.current.log} does not exist.`);
    process.exit(1);
};


let sessionAbsPath = path.join(__dirname, '../public', '.session.js');

utils.debug(`Session Absolute Path: ${sessionAbsPath}`)

fs.writeFileSync(sessionAbsPath, `GeoMapSSH = ${JSON.stringify(session)}`, (err) => {
    if (err) throw err;
    util.debug(`${sessionAbsPath} written.`)
});

utils.debug(JSON.stringify(session));

let geoJSON = {
    "type": "FeatureCollection",
    "features": []
};

const rl = lineReader.createInterface({                                                                                            
    input: fs.createReadStream(session.current.log)
});  
rl.on('line', (line) => {
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

    let loginAttemptsCount = 0;

    let coordinates;
    let lookup = geoip.lookup(ipAddress);
    (lookup === null) ? coordinates = [] : coordinates = lookup.ll;

    let feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": coordinates
        },
        "properties": {
            "time": timeStamp,
            "ip": ipAddress,
            "user": userName,
            "port": sshPort,
            "attempts": loginAttemptsCount
        }
    };
  geoJSON.features.push(feature);
});

fs.watch(session.current.log, { encoding: 'buffer' }, (eventType, fileName) => {
    if (eventType === "change") {                                                                                                          
        utils.debug(`${session.current.log} changed!`)
    }                                                                                                                                      
});

var app = express();
app.listen(session.current.port, () => utils.log(`listening on localhost:${session.current.port}`));

const apiBaseUrl = `/api/${session.default.apiVersion}`;

app.get('/', (req, res) => {
    const options = {
        root: path.join(__dirname, '../public')
    };
    res.sendFile('index.html', options);
});

app.get(`${apiBaseUrl}/session`, (req, res) => {
    const options = {
        dotfiles: 'allow'
    };
    res.sendFile(sessionAbsPath, options);
});

app.get(`${apiBaseUrl}/features`, (req, res) => res.send(JSON.stringify(geoJSON)));

