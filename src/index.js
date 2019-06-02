const fs = require('fs');
const lineReader = require('readline');
const path = require('path');
const express = require('express');
const geoip = require('geoip-lite');
const _ = require('lodash');
const Utils = require('./utils');
const Parse = require('./parse');
const argv = require('yargs')
      .usage('Usage: $0 -p [num] -p [str]')
      .alias('h', 'help')
      .alias('l', 'log')
      .alias('p', 'port')
      .argv;

let utils = new Utils();
let parse = new Parse();

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

let ipAddresses = [];

let rl = lineReader.createInterface({                                                                                            
    input: fs.createReadStream(session.current.log),
    crlfDelay: Infinity
});  
rl.on('line', (line) => {
    parse.line('Failed password', line, (propertiesObj) => {
	let lookupObj;
        let lookupGeoLocation = new Promise((resolve, reject) => {
	    lookupObj = geoip.lookup(propertiesObj.ip)
            //resolve(lookupObj);

            if (typeof lookupObj !== 'object' || lookupObj === null) {
	        reject();
	    } else {
	        resolve(lookupObj);
	    }
        });

        lookupGeoLocation.then(() => { 
	    let featureObjDefault = {
                "geometry": {
                    "coordinates": lookupObj.ll
                }
            }

	    //let featureObjDefault.geometry.coordinates = lookupObj.ll;

            const featureObjNew = utils.buildFeatureObj(propertiesObj);
	    const featureObj = _.merge(featureObjDefault, featureObjNew);
            
	    utils.debug(JSON.stringify(featureObj));
            geoJSON.features.push(featureObj);
        });
    
    });
});

fs.watch(session.current.log, { encoding: 'buffer' }, (eventType, fileName) => {
    if (eventType === "change") {                                                                                                          
        utils.debug(`${session.current.log} changed!`)
    }                                                                                                                                      
});

var app = express();
app.listen(session.current.port, () => utils.log(`listening on localhost:${session.current.port}`));

const apiBasePath = `/api/${session.default.apiVersion}`;

app.get('/', (req, res) => {
    const options = {
        root: path.join(__dirname, '../public')
    };
    res.sendFile('index.html', options);
});

app.get(`${apiBasePath}/session`, (req, res) => {
    const options = {
        dotfiles: 'allow'
    };
    res.sendFile(sessionAbsPath, options);
});

app.get(`${apiBasePath}/features`, (req, res) => res.send(JSON.stringify(geoJSON)));

