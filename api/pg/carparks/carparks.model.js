const client = require('../../../helpers/postgresClient');
const TABLE_NAME = 'carpark';
const TABLE_TYPE_NAME = 'list_type_carpark';

exports.getAll = function(param, values) {
    const args = [];
    let query;
    switch(param) {
        case 'map':
            query = `SELECT cp.*,type.name AS type_name, type.code AS type_code 
            FROM ${TABLE_NAME} cp
            left join ${TABLE_TYPE_NAME} type ON cp.type_id=type.id
            WHERE cp.deleted_at is null AND cp.deleted_by is null `;
            Object.keys(values).forEach((field, index, fields) => {
                if (field.startsWith('type_')) {
                    query += (!field.startsWith('type_not_')) ? ` AND type.${field.replace('type_', '')} = $${index+1}` : ` AND type.${field.replace('type_not_', '')} != $${index+1}`;
                } else{
                    query += (!field.startsWith('not_')) ? ` AND cp.${field} = $${index+1}` : ` AND cp.${field.replace('not_', '')} != $${index+1}`;
                }
                args.push(values[field]);
            });
            break;
        default:
            query = `select ${TABLE_NAME}.* from ${TABLE_NAME} `;
            query+='WHERE deleted_at is null AND deleted_by is null ';
            Object.keys(values).forEach((field, index, fields) => {
                query += ` AND ${field} = $${index+1}`;
                args.push(values[field]);
            });
            break;
    }
    
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
