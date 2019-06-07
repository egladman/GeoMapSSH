const faker = require('faker');
const fs = require('fs');
const util = require('util');

const setTimeoutPromise = util.promisify(setTimeout);

function Generate() {
  // Fuck it, Ship it.
  this.callbackAccumulatorCount = 0;
};

Generate.prototype.log = function (format, path, limit, writeInterval) {
    let self = this;

    if (typeof format !== "string") {
        throw new Error('Generate.log expects type: string for "format"');
    };

    if (typeof path !== "string") {
        throw new Error('Generate.log expects type: string for "path"');
    };
    self.path = path;

    if (typeof limit !== "number") { // How many lines do we want to generate?
        throw new Error('Generate.log expects type: number for "count"');
    };

    if (typeof writeInterval !== "undefined" && typeof writeInterval !== "number") { // OPTIONAL: How often should we write to the file?
        throw new Error('Generate.log expects type: number for "writeInterval"');
    };

    if (format !== 'auth.log') { // Right now only /var/log/auth.log is supported...
        throw new Error(`Unsupported format: ${type}`);
    };

    const callbackAccumulatorLimit = limit;

    if (typeof writeInterval !== 'undefined') {
        self.line(self.callbackAccumulatorCount, callbackAccumulatorLimit, writeInterval);
    } else {
        self.line(self.callbackAccumulatorCount, callbackAccumulatorLimit);
    }
};

Generate.prototype.line = function(callbackCount, callbackLimit, interval, callback) {
    // Returns a string with the following format
    // Feb 18 23:08:26 izxvps sshd[5768]: Failed password for root from 82.156.51.228 port 38156 ssh2

    let self = this;

    const options = {
        month: 'short',
	day: '2-digit',
	hour: '2-digit', // FIXME: For whatever reason the digit isn't getting padded...
	minute: '2-digit',
	second: '2-digit',
	hourCycle: 'h24'
    };
    randomDate = new Date(faker.date.recent(10));

    // Note: Intl.DateTimeFormat performs better than Date.toLocaleDateString
    const dateStr = new Intl.DateTimeFormat("en-US", options).format(randomDate).replace(/AM|PM|\,+/g, ''); 
    //const dateStr = randomDate.toLocaleDateString("en-US", options).replace(' PM', '').replace(/AM|PM|\,+/g, '');

    const process = faker.random.number(32768); //Default max pid id for most linux distros 
    const user = faker.internet.userName();
    const ip = faker.internet.ip();
    const port = faker.random.number(65535); //Upper limit of TCP port range

    // Note: For our purposes we don't care if the lines/dates aren't in chronological order
    const formatedLine = `${dateStr} izxvps sshd[${process}]: Failed password for ${user} from ${ip} port ${port} ssh2`;       
    fs.appendFile(self.path, formatedLine + '\n', (err) => {
        if (err) throw err;
    });
	
    if (self.callbackAccumulatorCount === callbackLimit) {
        console.log('callbackAccumulator completed!');
	return
    } else {
        self.callbackAccumulatorCount++;

        if (typeof interval !== 'undefined') {
            setTimeoutPromise(interval, true).then ((value) => {
                if (value === true) self.line(self.callbackAccumulatorCount, callbackLimit, interval);
            });
        } else {
            self.line(self.callbackAccumulatorCount, callbackLimit);
        }
    }
};

module.exports = Generate;
