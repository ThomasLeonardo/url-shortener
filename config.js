var config = {};

config.db = {};
// the URL shortening host - shortened URLs will be this + base58 ID
// i.e.: http://localhost:3000/3Ys

config.webhost = 'https://url-sm.herokuapp.com/';

// your MongoDB host and database name
config.db.host = 'Admin:130390@ds131621.mlab.com:31621';
config.db.name = 'small-url';

module.exports = config;