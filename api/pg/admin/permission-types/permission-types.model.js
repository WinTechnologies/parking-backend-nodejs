const client = require('../../../../helpers/postgresClient');
const TABLE_NAME = 'permission_type';

exports.create = function(body) {
    let query = `insert into ${TABLE_NAME}`;
    query += ' (id, permission_type, is_off, is_view, is_create, is_update, is_delete, permission_desc)';
    query += ' values (uuid(), $1, $2, $3, $4, $5, $6, $7)';
    const args = [
        body.permission_type,
        body.is_off,
        body.is_view,
        body.is_create,
        body.is_update,
        body.is_delete,
        body.permission_desc
    ];

    return client.query(query, args);
};

exports.getAll = function(params = {}) {
    let args = [];
    let query = `select * from ${TABLE_NAME}`;

    Object.keys(params).forEach((field, index, fields) => {
        if(index === 0) query += ' where ';
        query += ` ${field} = \$${index + 1}`;
        args.push(params[field]);
        if(index < fields.length - 1) query +=  ' and ';
    });
    return client.query(query, args);
};

exports.getOne = function (id) {
    const query = `SELECT * FROM ${TABLE_NAME} WHERE id = $1`;
    return client.query(query, [id]);
};

exports.delete = function(id) {
    const query = `delete from ${TABLE_NAME} where id = $1`;
    return client.query(query, [id]);
};

exports.update = function(id, body) {
    let query = `update ${TABLE_NAME} set `;
    let args = [];
    delete body.id;
    Object.keys(body).forEach((field, index, fields) => {
        query += ` ${field} = \$${index + 1}`;
        args.push(body[field]);
        if(index < fields.length - 1) query +=  ', ';
    });
    args.push(id);
    query += ` where id = \$${args.length}`;
    return client.query(query, args);
};
