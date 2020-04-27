const client = require('../../../helpers/postgresClient');
const TABLE_NAME = "bundle_services";

exports.create = function(body) {
    var query = "INSERT INTO " + TABLE_NAME
    + " (bundle_id, service_id, date_created) " +
    " VALUES ($1, $2, $3)";
    var args = [
        body.bundle_id,
        body.service_id,
        body.date_created
    ];
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

exports.delete = function(id) {
    const query = `delete from ${TABLE_NAME} where bundle_id = $1`;
    return client.query(query, [id]);
};

exports.update = function(id, body) {
    let updates = [];
    for(let field in body){
        if(body.hasOwnProperty(field) && body[field] && field !== 'id'){
            updates.push(client.query("update " + TABLE_NAME + " set " + field + " = $1 where id = $2", [body[field], id]));
        }
    }
    return Promise.all(updates);
};

exports.deleteByService = function(id) {
  const query = `delete from ${TABLE_NAME} where service_id = $1`;
  return client.query(query, [id]);
};
