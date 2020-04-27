const client = require('../../../helpers/postgresClient');
const TABLE_NAME = "list_type_note";

exports.create = function(body) {
    let query = `INSERT INTO ${TABLE_NAME}`;
    query += `(type_note) VALUES ($1)`;
    const args = [
        body.type_note
    ];
    return client.query(query, args);
};

exports.getAll = function(values) {
    let query = `select * from ${TABLE_NAME} `;
    const args = [];
    Object.keys(values).forEach((field, index, fields) => {
        if(index === 0){
            query+="WHERE "
        }
        query += index < (fields.length-1) ? `${field} = \$${index+1} AND ` : `${field} = \$${index+1}`;
        args.push(values[field]);
    });
    return client.query(query, args);
};

exports.getWithNoEnforcementType = function() {
    let query = `select * from ${TABLE_NAME} where operation_type IS NULL OR operation_type != 'Enforcement'`;
    return client.query(query);
};

exports.getOne = function(id) {
    const query = `select * from ${TABLE_NAME} where id = $1`;
    return client.query(query, [id]);
};

exports.delete = function(id) {
    const query = `delete from ${TABLE_NAME} where id = $1`;
    return client.query(query, [id]);
};

exports.update = function(id, body) {
    let updates = [];
    for (let field in body) {
        if (body.hasOwnProperty(field) && body[field] !== null && field !== 'id') {
            updates.push(client.query(`update ${TABLE_NAME} set ${field} = \$1 where id = \$2`, [body[field], id]));
        }
    }
    return Promise.all(updates);
};
