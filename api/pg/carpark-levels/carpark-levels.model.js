const client = require('../../../helpers/postgresClient');
const TABLE_NAME = 'carpark';

exports.create = function(body, created_by) {
    let columns = 'id, date_created, created_by';
    let values = 'default, current_timestamp, $1';
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
    let query = `select * from ${TABLE_NAME} `;
    const args = [];
    query+='WHERE deleted_at is null AND deleted_by is null ';
    Object.keys(values).forEach((field, index, fields) => {
        query += ` AND ${field} = $${index+1}`;
        args.push(values[field]);
    });
    return client.query(query, args);
};

exports.getOne = function(id) {
    const query = `select * from ${TABLE_NAME} where id = $1`;
    return client.query(query, [id]);
};

exports.delete = function(id, deleted_by) {
    // const query = `delete from ${TABLE_NAME} where id = $1`;
    const query = `update ${TABLE_NAME} set deleted_at = current_timestamp, deleted_by = $1 where id = $2`;
    return client.query(query, [deleted_by, id]);
};

exports.delByQuery = function(params, deleted_by) {
    let query = `update ${TABLE_NAME} set deleted_at = current_timestamp, deleted_by = $1 where `;
    const args = [deleted_by];

    Object.keys(params).forEach((field, index, fields) => {
        query += index < (fields.length-1) ? `${field} = $${index + 2} and ` : `${field} = $${index + 2}`;
        args.push(params[field]);
    });
    return client.query(query, args);
};

exports.update = function(id, body) {
    let updates = [];
    for (let field in body) {
        if (body[field] !== null && field !== 'id') {
            updates.push(client.query(`update ${TABLE_NAME} set ${field} = $1 where id = $2`, [body[field], id]));
        }
    }
    return Promise.all(updates);
};