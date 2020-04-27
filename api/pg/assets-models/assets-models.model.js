const client = require('../../../helpers/postgresClient');
const TABLE_NAME = 'asset_model_2'; // 'asset_model';
const TABLE_TYPE_NAME = "asset_type_2";
const TABLE_CATEGORY_NAME = "list_asset_category";
const ASSET_TABLE_NAME = 'asset_2';

exports.create = function(body, modelCode) {
    body.code = modelCode;
    let columns = '';
    let values = '';
    const args = [];
    Object.keys(body)
        .filter(field => field !== 'category_asset' && field !== 'type_asset' && body[field] !== null && body[field] !== '')
        .forEach((field, index, fields) => {
        columns += index < (fields.length - 1) ? `${field},` : `${field}`;
        values += index < (fields.length - 1) ? `$${index + 1},` : `$${index + 1}`;
        args.push(body[field]);

    });
    const query = `INSERT INTO ${TABLE_NAME} (${columns}) VALUES (${values})`;
    return client.query(query, args);
};

exports.getAll = function(values) {
    let query = `SELECT model.id as id, model.code AS code, model.name AS name, model.manufacturer, model.configurations, 
    model.firmware_version, model.product_warranty, model.notes AS notes, model.img_url, model.type_id, 
    model.fullspecs_link, type.name AS type_asset, category.name AS category_asset
    FROM ${TABLE_NAME} model 
    LEFT JOIN ${TABLE_TYPE_NAME} type 
    ON type.id = model.type_id
    LEFT JOIN ${TABLE_CATEGORY_NAME} category
    ON category.id = type.category_id `;
    const fields = Object.keys(values);
    let args = [];
    let i = 0;
    fields.forEach((field) => {
        if(i === 0) query += 'WHERE ';
        switch(field) {
            case 'category_asset':
                query += `category.name = $${(i + 1)}`;
                break;
            case 'type_asset':
                query += `type.name = $${i + 1}`;
                break; 
            default:
                query += `model.${field} = $${(i + 1)}`;
                break;
        }
        args.push(values[field]);
        i++;
        if(i < fields.length) query += ' AND ';
    });
    return client.query(query, args);
};

exports.getAllWithCounts = function(values, project_id) {
    let query = `SELECT model.id as id, count(asset.codification_id) as instance_count, 
        model.name as name, 
        type.name as type_asset, 
        model.manufacturer, model.configurations, 
        model.firmware_version, model.product_warranty,
        model.notes as notes, model.img_url, 
        model.fullspecs_link, model.code as code, 
        category.name as category_asset
    FROM ${TABLE_NAME} model
    LEFT JOIN ${TABLE_TYPE_NAME} type ON type.id=model.type_id
    LEFT JOIN ${TABLE_CATEGORY_NAME} category ON category.id=type.category_id
    LEFT JOIN ${ASSET_TABLE_NAME} asset
        ON asset.model_id = model.id `;
    if (project_id) {
        query += ` AND asset.project_id = ${project_id} `;
    }
    const fields = Object.keys(values);
    let args = [];
    let i = 0;
    fields.forEach(field => {
        if(i === 0) query += 'WHERE ';
        const fieldName = field === 'type_asset' ? `type.code` : `model.${field}`;
        query += `${fieldName} = $${(i + 1)}`;
        args.push(values[field]);
        i++;
        if(i < fields.length) query += ' AND ';
    });
    query += ` GROUP BY model.id, model.name, type.name, 
        model.manufacturer, model.configurations, model.firmware_version, 
        model.product_warranty,
        model.notes, model.img_url, model.fullspecs_link, 
        model.code, category.name`;

    return client.query(query, args);
};

exports.getCategoryAsset = function() {
    let query = `select distinct name AS category_asset from ${TABLE_CATEGORY_NAME} where name is not null`;
    return client.query(query);
};

exports.delete = function(id) {
    const query = `delete from ${TABLE_NAME} where id = $1`;
    return client.query(query, [id]);
};

exports.update = function(id, body) {
    let updates = [];
    Object.keys(body)
        .filter(field => body.hasOwnProperty(field) && body[field] && field !== 'id' && field !== 'category_asset' && field !== 'type_asset')
        .forEach(field => {
            updates.push(client.query(`update ${TABLE_NAME} set ${field} = $1 where id = $2`, [body[field], id]));
        });
    return Promise.all(updates);
};
