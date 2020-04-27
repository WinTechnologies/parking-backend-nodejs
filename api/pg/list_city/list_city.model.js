const client = require('../../../helpers/postgresClient');
const TABLE_NAME = "list_city";
const PROJECT_NAME = "project";

function getAll(values) {
    let query = `select * from ${TABLE_NAME} `;
    const { query: searchQuery, args } = client.addSearchByParams(query, values);
    return client.query(searchQuery, args);
}

function getAllWithProjects(values) {
    let query = `SELECT ${TABLE_NAME}.city_code, ${TABLE_NAME}.city_code_pin, ${PROJECT_NAME}.* from ${TABLE_NAME}
        LEFT JOIN ${PROJECT_NAME} ON ${TABLE_NAME}.city_name = ${PROJECT_NAME}.city_name`;

    const { query: searchQuery, args } = client.addSearchByParams(query, values);
    return client.query(searchQuery, args);
}

exports.create = function(body) {
    let query = `INSERT INTO ${TABLE_NAME} (city_code, city_name) VALUES ($1, $2)`;
    const args = [
        body.city_code,
        body.city_name
    ];
    return client.query(query, args);
};

exports.getOne = function(city_code) {
    const query = `select * from ${TABLE_NAME} where city_code = $1`;
    return client.query(query, [city_code]);
};


exports.delete = function(city_code) {
    const query = `delete from ${TABLE_NAME} where city_code = $1`;
    return client.query(query, [city_code]);
};

exports.update = function(city_code, body) {
    let updates = [];
    for (let field in body) {
        if (body.hasOwnProperty(field) && body[field] !== null && field !== 'city_code') {
            updates.push(client.query(`update ${TABLE_NAME} set ${field} = \$1 where city_code = \$2`, [body[field], city_code]));
        }
    }
    return Promise.all(updates);
};

exports.getAll = getAll;
exports.getAllWithProjects = getAllWithProjects;
