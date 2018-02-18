const fs = require('fs');
const lineReader = require('readline');
const path = require('path');
const express = require('express');
const geoip = require('geoip-lite');
const argv = require('yargs')
      .usage('Usage: $0 -p [num] -p [str]')
      .alias('h', 'help')
      .alias('l', 'log')
      .alias('p', 'port')
      .argv;

let file, port;
(argv.log) ? file = argv.log : file = "/var/log/auth.log";
(argv.port) ? port = argv.port : port = 8000;

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
    (lookup === null) ? coordinates = [] : coordinates = lookup.ll;

    let feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": coordinates
        },
        "properties": {
            "time": timeStamp,
            "timeZone": Intl.DateTimeFormat().resolvedOptions().timeZone,
            "ip": ipAddress,
            "user": userName,
            "port": sshPort
        }
    };
    geoJSON.features.push(feature);
});

var app = express();
app.listen(port, () => console.log(`listening on localhost:${port}`));

app.get('/', function (req, res) {
    res.sendFile('index.html', { root: path.join(__dirname, '../public') });
});

app.get('/features', function (req, res) {
    res.send(JSON.stringify(geoJSON));
});
