const client = require('../../../../helpers/postgresClient');
const TABLE_NAME = 'permission_feature';

exports.create = function(body) {
    let query = `insert into ${TABLE_NAME}`;
    query += ' (id, section, feature, feature_desc, permission_type, feature_name)';
    query += ' values (uuid(), $1, $2, $3, $4, $5)';
    const args = [
        body.section,
        body.feature,
        body.feature_desc,
        body.permission_type,
        body.feature_name
    ];

    return client.query(query, args);
};

exports.getAll = function(params = {}) {
    let args = [];
    let query = `select * from ${TABLE_NAME}`;

    query += ' where is_active = true';
    Object.keys(params).forEach((field, index, fields) => {
        // if(index === 0) query += ' where ';
        query += ` ${field} = \$${index + 1}`;
        args.push(params[field]);
        if(index < fields.length - 1) query +=  ' and ';
    });
    query += ' ORDER BY id ASC';
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

exports.getAvailableSections = function () {
    const query = `SELECT distinct section FROM ${TABLE_NAME}`;
    return client.query(query, []);
};