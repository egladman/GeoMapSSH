const Generate = require('./generate');

let generate = new Generate();

const path = 'tmp/.auth.log';
generate.log('auth.log', path, 3500);
