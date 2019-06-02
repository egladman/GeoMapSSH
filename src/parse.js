function Parse() {
  // Fuck it, Ship it.
};

Parse.prototype.authLog = function (interface, callback) { 
    if (typeof interface !== "object") {
        throw new Error('Parse.authLog expects readline interface with type: object');
    }

    if (typeof callback === "function") {
        // todo
    }
}

Parse.prototype.line = function (keyWord, line, callback) {  
    if (typeof line !== "string") {
        throw new Error('Parse.line expects line to have type: string');
    }

    if (typeof keyWord !== "string") {
        throw new Error('Parse.line expects keyWord to have type: string');
    }

    if ( line.indexOf(keyWord) === 0 ) return; // Ignore lines that don't include keyWord

    const lineArray = line.split(" ");

    let i, ip;
    i = lineArray.indexOf('from');
    ip = lineArray[i+1];
    //ipAddresses.push(ip); // Collect all IPs

    let j, port;
    j = lineArray.indexOf('port');
    port = lineArray[j+1];

    let k, user;
    k = lineArray.indexOf('for');
    user = lineArray[k+1];

    time = "".concat(lineArray[0], " ", lineArray[1], " ", lineArray[2]); // Not the most elegant solution...

    const obj = {
        "time": time,
	"ip": ip,
	"port": port,
    }

    if (typeof callback === "function") {
        callback(obj);
    }
}


module.exports = Parse;
