const client = require('../../../helpers/postgresClient');
const TABLE_NAME = "tariff_segment";

exports.create = function(body, created_by) {
    let columns = 'created_by';
    let values = '$1';
    const args = [created_by];

    Object.keys(body).forEach((field, index, fields) => {
        columns += `, ${field}`;
        values += `, $${index + 2}`;
        args.push(body[field]);
    });
    const query = `insert into ${TABLE_NAME} (${columns}) values (${values}) returning id`;
    return client.query(query, args);
};

exports.getAll = function(values) {
    let query = "select * from " + TABLE_NAME + " ";
    const fields = Object.keys(values);
    const args = [];
    query += ' WHERE deleted_at is null AND deleted_by is null ';

    fields.forEach((field, i) => {
        query += ` AND ${field} = $${i+1}`;
        args.push(values[field]);
    });
    return client.query(query, args);

};

exports.getValidSegment = function(values) {
    let query = "select * from tariff_segment \
                  where deleted_at is null AND deleted_by is null AND (( \
                        (tariff_segment.date_start BETWEEN $1 AND $2) \
                        Or (tariff_segment.date_end BETWEEN $1 AND $2) \
                        Or ((tariff_segment.date_start <= $1) AND ($2 <= tariff_segment.date_end))\
                  ) \
                  AND type_client = $3) ";

    const args = [
        values.from,
        values.to,
        values.type_client
    ];
    if (values.is_onstreet === true || values.is_onstreet === 'true') {
        query += ' AND is_onstreet = true AND parking_id = $4';
        args.push(values.parking_id);
    } else {
        query += ' AND is_carpark = true AND carpark_zone_id = $4';
        args.push(values.carpark_zone_id);
    }
    return client.query(query, args);
};

exports.delete = function(id, deleted_by) {
    const query = `update ${TABLE_NAME} set deleted_at = current_timestamp, deleted_by = $1 where id = $2`;
    return client.query(query, [deleted_by, id]);
};

exports.update = function(id, body) {
    delete body.id;
    delete body.intervals;

    let updates = [];
    for(let field in body){
        if(body.hasOwnProperty(field)  && body[field]){
            updates.push(client.query("update " + TABLE_NAME + " set " + field + " = $1 where id = $2", [body[field], id]));
        }
    }
    return Promise.all(updates);
};
