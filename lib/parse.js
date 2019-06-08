function Parse() {
  // Fuck it, Ship it.
}

Parse.prototype.authLog = (readLineInterface, callback) => {
  if (typeof readLineInterface !== 'object') {
    throw new Error('Parse.authLog expects readline interface with type: object');
  }

  if (typeof callback === 'function') {
    callback();
  }
};

Parse.prototype.line = (keyWord, line, callback) => {
  if (typeof line !== 'string') {
    throw new Error('Parse.line expects line to have type: string');
  }

  if (typeof keyWord !== 'string') {
    throw new Error('Parse.line expects keyWord to have type: string');
  }

  if (line.indexOf(keyWord) === 0) return; // Ignore lines that don't include keyWord

  const lineArray = line.split(' ');

  const i = lineArray.indexOf('from');
  const ipAddress = lineArray[i + 1];

  const j = lineArray.indexOf('port');
  const portNumber = lineArray[j + 1];

  const k = lineArray.indexOf('for');
  const userName = lineArray[k + 1];

  const timeStamp = ''.concat(lineArray[0], ' ', lineArray[1], ' ', lineArray[2]); // Not the most elegant solution...

  const obj = {
    time: timeStamp,
    user: userName,
    ip: ipAddress,
    port: portNumber,
  };

  if (typeof callback === 'function') callback(obj);
};

module.exports = Parse;
