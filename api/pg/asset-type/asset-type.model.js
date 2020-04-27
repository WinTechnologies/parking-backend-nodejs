const client = require('../../../helpers/postgresClient');
const TABLE_NAME = "asset_type_2"; // "asset_type";
const TABLE_CATEGORY_NAME = "list_asset_category";

exports.create = function(body) {
    const selectCategoryId = `(SELECT id AS category_id FROM ${TABLE_CATEGORY_NAME} WHERE name=$4)`;
    let query = `INSERT INTO ${TABLE_NAME} (code, name, icon_url, category_id, created_by) 
    VALUES ($1, $2, $3, ${selectCategoryId}, $5)`;
    const args = [
        body.code,
        body.name,
        body.icon_url,
        body.category_asset,
        body.created_by
    ];
    return client.query(query, args);
};

exports.getAll = function(values) {
    let query = `SELECT type.id, type.code AS code, type.name AS name, 
    type.created_by, type.created_at, category.name AS category_asset, type.icon_url FROM 
    ${TABLE_CATEGORY_NAME} category LEFT JOIN ${TABLE_NAME} type 
    ON type.category_id = category.id `;
    const args = [];
    Object.keys(values).forEach((field, index, fields) => {
        if(index === 0){
            query+=`WHERE `;
        }
        query += index < (fields.length-1) ? `type.${field} = \$${index+1} AND ` : `type.${field} = \$${index+1}`;
        args.push(values[field]);
    });
    return client.query(query, args);
};

exports.getCategoryAsset = function() {
    let query = `select id, name AS category_asset from ${TABLE_CATEGORY_NAME} where name is not null`;
    return client.query(query);
};

exports.getOne = function(id) {
    const query = `SELECT type.id, type.code AS code, type.name AS name, 
    type.created_by, type.created_at, category.name AS category_asset FROM 
    ${TABLE_CATEGORY_NAME} category LEFT JOIN ${TABLE_NAME} type 
    ON type.category_id = category.id WHERE type.id=$1`;
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
            updates.push(client.query(`update ${TABLE_NAME} set ${field} = $1 where id = $2`, [body[field], id]));
        }
    }
    return Promise.all(updates);
};
