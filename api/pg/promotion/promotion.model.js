const client = require('../../../helpers/postgresClient');
const TABLE_NAME = 'promotion';

exports.create = (body) => {
    let columns = 'id, date_created';
    let values = 'DEFAULT, now()';
    const args = [];

    // Remove the selectedParkings
    delete body.selectedParkings;

    Object.keys(body).forEach((field, index, fields) => {
        columns += `, ${field}`;
        values += `, \$${index + 1}`;
        args.push(body[field]);
    });
    const query = `insert into ${TABLE_NAME} (${columns}) values (${values}) RETURNING id`;
    return client.query(query, args);
};

exports.getAll = (params = {}) => {
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

exports.getOne = (id) => {
    const query = `SELECT * FROM ${TABLE_NAME} WHERE id = $1`;
    return client.query(query, [id]);
};

exports.delete = (id) => {
    const query = `delete from ${TABLE_NAME} where id = $1`;
    return client.query(query, [id]);
};

exports.update = (id, body) => {
    let query = `update ${TABLE_NAME} set `;
    let args = [];
    delete body.id;
    delete body.selectedParkings;
    Object.keys(body).forEach((field, index, fields) => {
        query += ` ${field} = \$${index + 1}`;
        args.push(body[field]);
        if(index < fields.length - 1) query +=  ', ';
    });
    query += ` where id = ${id}`;
    return client.query(query, args);
};
