const fs = require('fs');

function Helpers() {
  // Fuck it, Ship it.
}

Helpers.prototype.debug = (message, callback) => {
  const prefix = '[DEBUG]';
  console.log(prefix, message); // eslint-disable-line no-console

  if (typeof callback === 'function') callback();
};

Helpers.prototype.error = (message, callback) => {
  const prefix = '[ERROR]';
  console.log(prefix, message); // eslint-disable-line no-console

  if (typeof callback === 'function') callback();
};

Helpers.prototype.log = (message, callback) => {
  const prefix = '[LOG]';
  console.log(prefix, message); // eslint-disable-line no-console

  if (typeof callback === 'function') callback();
};

Helpers.prototype.countArrayDuplicates = (string, array) => {
  if (typeof string !== 'string') {
    throw new Error('Helpers.countArrayDuplicates expects a string.');
  }

  if (typeof array !== 'object') {
    throw new Error('Helpers.countDuplicates expects an array.');
  }

  const count = array.filter(
    (x) => { return x === string; } // eslint-disable-line
  ).length;
  return count;
};

Helpers.prototype.buildFeatureObj = (propertiesObj) => {
  if (typeof propertiesObj !== 'object') {
    throw new Error('Helpers.buildFeatureObj expects an object.');
  }

  const featureObj = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [],
    },
    properties: propertiesObj,
  };
  return featureObj;
};

Helpers.prototype.countFileLines = (path, callback) => {
  if (typeof path !== 'string') {
    throw new Error('Helpers.countFileLines expects a string.');
  }

  let i;
  let count = 0;
  fs.createReadStream(path).on('data', (chunk) => {
    for (i = 0; i < chunk.length; i += 1) {
      if (chunk[i] === 10) count += 1;
    }
  }).on('end', () => {
    if (typeof callback === 'function') callback(count);
  });
};

module.exports = Helpers;
