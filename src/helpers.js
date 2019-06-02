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

Helpers.prototype.log = function (message, callback) { 
    const prefix = `[LOG]`;
    console.log(prefix, message);

    if (typeof callback === "function") {
	callback();
    }
}

Helpers.prototype.countDuplicates = function (string, array) { 
    if (typeof string !== 'string') {
        throw new Error('Utils.countDuplicates expects a string.')
    }

    if (typeof array !== 'object') {
        throw new Error('Utils.countDuplicates expects an array.')
    }
    return array.filter((x) => { return x === string; }).length;
}

Helpers.prototype.buildFeatureObj = function (propertiesObj) {
    if (typeof propertiesObj !== 'object') {
        throw new Error('Utils.buildFeatureObj expects an object.')
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

module.exports = Helpers;
