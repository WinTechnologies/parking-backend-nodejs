var config = require('../config/database');
var cassandra = require('cassandra-driver');
var PlainTextAuthProvider = cassandra.auth.PlainTextAuthProvider;
// TODO: Remove code for cassandra DB
var client = new cassandra.Client({
    contactPoints: ['127.0.0.1'],
    keyspace: config.keyspace,
    authProvider: new PlainTextAuthProvider('dev', 'parking_@cto'),
    encoding: { useUndefinedAsUnset: false }
});
client.connect(function(err, result){
    console.info('Server connected to database / keyspace: ', config.keyspace);
});

module.exports = client;
