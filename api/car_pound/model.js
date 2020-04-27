const postgresClient = require('../../helpers/postgresClient');
const util = require('util');

var server = require('../../bin/www');

const TABLE_NAME = "carpark";

exports.getAllCarPound = function(params) {
    var queryStr = "SELECT * FROM " + TABLE_NAME + " where operation_type = $1 and project_id = $2";
    return postgresClient.query(queryStr,["Enforcement",params.project_id]);
};
