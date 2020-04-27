const client = require('../../../helpers/postgresClient');
const TABLE_VEHICLE_MAKE = 'vehicle_make';

const get = (params) => {
    let query = `SELECT * FROM ${TABLE_VEHICLE_MAKE}`;

    Object.keys(params).forEach((field, index, fields) => {
        query += `${index === 0 ? ' WHERE' : ' AND '} ${ field } = '${ params[field] }'`;
    });
    return client.query(query);
};

const add = (params) => {
    var query = `INSERT INTO ${TABLE_VEHICLE_MAKE} ( make_code, make_name_en, make_name_ar) VALUES ($1,$2,$3)`;
    var args = [
        params.make_code,
        params.make_name_en,
        params.make_name_ar
    ];
    return client.query(query, args);
};


const edit = async (params) => {
    let query = `UPDATE ${TABLE_VEHICLE_MAKE} SET `;
    Object.keys(params).forEach((field, index, fields) => {
        query += `${index === 0 ? ' ' : ', '} ${ field } = '${ params[field] }'`;
    });
    query += `WHERE id=${params.id}`;

    return client.query(query);
};


const del = async (params) => {
    let query = `DELETE FROM ${TABLE_VEHICLE_MAKE}`;

    Object.keys(params).forEach((field, index, fields) => {
        query += `${index === 0 ? ' WHERE' : ' AND '} ${ field } = '${ params[field] }'`;
    });
    return client.query(query);
};

exports.get = get;
exports.add = add;
exports.edit = edit;
exports.del = del;