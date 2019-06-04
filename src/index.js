const fs = require('fs');
const util = require('util');
const _ = require('lodash');
const lineReader = require('readline');
const path = require('path');
const express = require('express');
const geoip = require('geoip-lite');
const Helpers = require('./helpers');
const Parse = require('./parse');
const argv = require('yargs')
      .usage('Usage: $0 -p [num] -p [str]')
      .alias('h', 'help')
      .alias('l', 'log')
      .alias('p', 'port')
      .argv;

let helpers = new Helpers();
let parse = new Parse();
const setTimeoutPromise = util.promisify(setTimeout);

let isReadLineReadyMutex = false;
let isReadLineQueuedMutex = false;
const readLineInterval = 300000; // 5 minutes in milliseconds

let session = {
    default: {
        lastLineRead: -1,
        log: '/var/log/auth.log',
	logSize: -1,
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

helpers.debug(`Session Absolute Path: ${sessionAbsPath}`)

fs.writeFileSync(sessionAbsPath, `GeoMapSSH = ${JSON.stringify(session)}`, (err) => {
    if (err) throw err;
    helpers.debug(`${sessionAbsPath} written.`)
});

helpers.debug(JSON.stringify(session));

let geoJSON = {
    "type": "FeatureCollection",
    "features": []
};

function initLineReader() {
    isReadLineReadyMutex = false;
    isReadLineQueuedMutex = false;
    let count = 0;
    let skip = false;

    let rl = lineReader.createInterface({                                                                                            
        input: fs.createReadStream(session.current.log),
        crlfDelay: Infinity
    });  
    rl.on('line', (line) => {
	count++;
	(count <= session.current.lastLineRead) ? skip = true : helpers.debug(`Resuming read from line: ${count}`);

        if (skip === false) parse.line('Failed password', line, (propertiesObj) => {
	    let lookupObj;
            let lookupGeoLocation = new Promise((resolve, reject) => {
	        lookupObj = geoip.lookup(propertiesObj.ip)

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

                const featureObjNew = helpers.buildFeatureObj(propertiesObj);
	        const featureObj = _.merge(featureObjDefault, featureObjNew);
            
	        helpers.debug(JSON.stringify(featureObj));
                geoJSON.features.push(featureObj);
            });
    
        });
    });

    rl.on('close', () => {
        setTimeoutPromise(readLineInterval, true).then ((value) => {
	    isReadLineReadyMutex = value;
            helpers.debug(`isReadLineReadyMutex returned ${value}. Ready!`)

	    if (isReadLineQueuedMutex === true) {
	        helpers.debug(`File: ${session.current.log} was modified during timeout! Calling initLineReader()`);
		initLineReader();
	    };
	});

	if (session.current.logSizeCached < session.current.logSizeLatest || typeof session.current.logSizeCached  === 'undefined') {
	    helpers.countFileLines(session.current.log, (value) => {
                let str;
		(session.current.lastLineRead === -1) ? str = "" : str = `File: ${session.current.log} increased in size. `; 
		session.current.lastLineRead = value;
                helpers.debug(`${str}Setting lastLineRead to ${session.current.lastLineRead}`)
            });
	} else { // File shrunk in size
            session.current.lastLineRead = -1; // Reset count
            helpers.debug(`File: ${session.current.log} decreased in size; logs must've rotated. Setting lastLineRead to ${session.current.lastLineRead}`);
	}
    });
};
initLineReader();

fs.watchFile(session.current.log, (curr, prev) => {
    session.current.logSizeCached = prev.size;
    session.current.logSizeLatest = curr.size;

    if (isReadLineReadyMutex === true) {
        helpers.debug(`File: ${session.current.log} was modified! isReadLineReadyMutex returned true. Calling initLineReader()`);
        initLineReader();
    } else {
        isReadLineQueuedMutex = true;
        helpers.debug(`File: ${session.current.log} was modified! isReadLineReadyMutex returned false. Going back to sleep...`)
    }
});

var app = express();
app.listen(session.current.port, () => helpers.log(`listening on localhost:${session.current.port}`));

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

