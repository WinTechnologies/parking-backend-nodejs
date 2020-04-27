var config_transaction = require('../config/database_predictive_parking');
var cassandra = require('cassandra-driver');
var PlainTextAuthProvider = cassandra.auth.PlainTextAuthProvider;
// TODO: Remove code for cassandra DB
var client_transactions = new cassandra.Client({
    contactPoints: ['127.0.0.1'],
    keyspace: config_transaction.keyspace,
    authProvider: new PlainTextAuthProvider('dev', 'parking_@cto'),
    encoding: { useUndefinedAsUnset: false }
});
client_transactions.connect(function(err, result){
    console.info('Server connected to database / keyspace: ', config_transaction.keyspace);
});

module.exports = client_transactions;
