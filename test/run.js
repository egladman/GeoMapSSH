const Generate = require('./generate');

let generate = new Generate();

const path = 'tmp/.auth.log';

// prints 3333 lines all at one time
//generate.log('auth.log', path, 3333);

// prints 3333 lines one at a time every 30 seconds
generate.log('auth.log', path, 3333, 30000);
