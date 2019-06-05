const fs = require('fs');

function Helpers() {
  // Fuck it, Ship it.
};

Helpers.prototype.debug = function (message, callback) { 
    const prefix = `[DEBUG]`;
    console.log(prefix, message);

    if (typeof callback === "function") {
        callback();
    }
}

Helpers.prototype.error = function (message, callback) {
    const prefix = `[ERROR]`;
    console.log(prefix, message);

    if (typeof callback === "function") {
        callback();
    }
}

Helpers.prototype.log = function (message, callback) { 
    const prefix = `[LOG]`;
    console.log(prefix, message);

    if (typeof callback === "function") {
	callback();
    }
}

Helpers.prototype.countArrayDuplicates = function (string, array) { 
    if (typeof string !== 'string') {
        throw new Error('Helpers.countArrayDuplicates expects a string.')
    }

    if (typeof array !== 'object') {
        throw new Error('Helpers.countDuplicates expects an array.')
    }
    return array.filter((x) => { return x === string; }).length;
}

Helpers.prototype.buildFeatureObj = function (propertiesObj) {
    if (typeof propertiesObj !== 'object') {
        throw new Error('Helpers.buildFeatureObj expects an object.')
    }    

    const featureObj =  {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": []
        },
        "properties": propertiesObj
    };
    return featureObj;
}

Helpers.prototype.countFileLines = function (path, callback) {
    if (typeof path !== 'string') {
        throw new Error('Helpers.countFileLines expects a string.')
    }

    let i;
    let count = 0;
    fs.createReadStream(path)
      .on('data', function(chunk) {
        for (i=0; i < chunk.length; ++i)
          if (chunk[i] == 10) count++;
      })
      .on('end', function() {
          if (typeof callback === "function") {
              callback(count);
          }
      });
}


module.exports = Helpers;
