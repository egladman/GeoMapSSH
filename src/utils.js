function Utils() {
  // Fuck it, Ship it.
};

Utils.prototype.debug = function (message, callback) { 
    const prefix = `[DEBUG]`;
    console.log(prefix, message);

    if (typeof callback === "function") {
        // todo
    }
}

Utils.prototype.log = function (message, callback) { 
    const prefix = `[LOG]`;
    console.log(prefix, message);

    if (typeof callback === "function") {
        // todo
    }
}

module.exports = Utils;
