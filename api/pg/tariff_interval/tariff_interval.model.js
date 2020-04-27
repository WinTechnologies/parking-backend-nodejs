const client = require('../../../helpers/postgresClient');
const TABLE_NAME = "tariff_interval";

exports.create = function(body) {
    var query = "INSERT INTO " + TABLE_NAME
    + " (segment_id, time_step, time_start, time_end, price, price_init, rate_growth, type_tariff, description ) " +
    " VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)";
    var args = [
        body.segment_id,
        body.time_step,
        body.time_start,
        body.time_end,
        body.price,
        body.price_init,
        body.rate_growth,
        body.type_tariff,
        body.description,
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

    query += ' order by id asc';
    return client.query(query, args);

};

exports.delete = function(id) {
    const query = "delete from " + TABLE_NAME + " where id = $1";
    return client.query(query, [id]);
};

exports.deleteBySegmentId = function(segment_id) {
    const query = "delete from " + TABLE_NAME + " where segment_id = $1";
    return client.query(query, [segment_id]);
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