const client = require('../../../helpers/postgresClient');
const TABLE_NAME = "act_enforcement_incentive_band";

exports.create = function(body) {

    let column = "";
    let values = "";
    let i=1;
    for(let field in body) {
        column+= field + ', ';
        values+="$"+i+", ";
        i++;
    }
    column = column.substring(0, column.length - 2);
    values = values.substring(0, values.length - 2);
    var query = "INSERT INTO " + TABLE_NAME + " (" + column + ") " +
        "VALUES (" + values +")";

    var args = Object.values(body);

    return client.query(query, args);
};

exports.getAll = function(values) {
    var query = "select * from " + TABLE_NAME + " ";
    var fields = Object.keys(values);
    var args = [];
    var i = 0;

    fields.forEach(x => {
        if(i == 0) query += "WHERE ";
        query += x + " = $" + (i + 1);
        args.push(values[x]);
        i++;
        if(i < fields.length) query += " AND ";
    });
    return client.query(query, args);
};

exports.get = function(incentive_id) {
    var query = "select * from " + TABLE_NAME + " where incentive_id = $1 " ;
    return client.query(query, [incentive_id]);
};

exports.update = function(band_id, body) {
    let updates = [];
    for(let field in body){
        if(body.hasOwnProperty(field) && body[field] && field !== 'band_id'){
            updates.push(client.query("update " + TABLE_NAME + " set " + field + " = $1 where band_id = $2", [body[field], band_id]));
        }
    }
    return Promise.all(updates);
};

exports.delete = function(band_id) {
    const query = "delete from " + TABLE_NAME + " where band_id = "+ band_id;
    return client.query(query);
};

exports.deleteByIncentive = function(incentive_id) {
    const query = "delete from " + TABLE_NAME + " where incentive_id = " + incentive_id;
    return client.query(query);
};