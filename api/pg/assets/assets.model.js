const client = require('../../../helpers/postgresClient');
const TABLE_CATEGORY = 'list_asset_category';
const TABLE_TYPE = 'asset_type_2';
const TABLE_MODEL = 'asset_model_2';
const TABLE_ASSET = 'asset_2';
const TABLE_PROJECT = 'project';
const TABLE_ZONE = 'project_zone';
const TABLE_CITY = 'list_city';
const TABLE_PARKING = 'parking';
const TABLE_CARPARK = 'carpark';
const TABLE_CARPARK_ZONE = 'carpark_zone';

exports.create = function (body) {
    let columns = '';
    let values = '';
    const args = [];
    Object.keys(body)
        .filter(field => (
            field !== 'date_created' && field !== 'type_asset' &&
            field !== 'model_code' && field !== 'city_txt' &&
            field !== 'manufacturer' && field !== 'model_txt' &&
            field !== 'firmware_version' && body[field] !== null && body[field] !== ''
            ))
        .forEach((field, index, fields) => {
            const fieldName = field === 'date_end_of_life' ? 'eol_at' :
            field === 'product_warranty' ? 'warranty_until' :
            field === 'asset_notes' ? 'notes' :
            field === 'date_deployed' ? 'deployed_at' :
            field;
        columns += index < (fields.length - 1) ? `${fieldName},` : `${fieldName}`;
        values += index < (fields.length - 1) ? `\$${index + 1},` : `\$${index + 1}`;
        args.push(body[field]);
    });
    const query = `INSERT INTO ${TABLE_ASSET} (${columns}) VALUES (${values})`;
    return client.query(query, args);
};

exports.getAll = function (values) {
    let query = `SELECT asset.codification_id, asset.latitude,
    asset.longitude, asset.model_id,
    asset.status, asset.eol_at AS date_end_of_life,
    asset.warranty_until AS warranty_until,
    asset.configurations, asset.img_url,
    asset.notes AS asset_notes, asset.ip_address,
    asset.vehicle_plate, asset.vehicle_plate_ar,
    asset.vehicle_brand, asset.vehicle_brand_ar,
    asset.vehicle_country, asset.vehicle_country_ar,
    asset.status_vehicle, asset.project_id,
    asset.zone_id, asset.parking_id,
    asset.carpark_id, asset.carpark_zone_id,
    asset.deployed_at AS date_deployed,
    asset.created_by, asset.created_at AS date_created,
    model.code AS model_code, model.name AS model_txt,
    model.firmware_version,
    zone.zone_code AS zone_code, zone.zone_name AS zone_txt,
    type.name AS type_asset, project.project_name AS project_name, 
    city.city_name AS city_txt, city.city_code AS city_code,
    category.id AS category_asset,
    model.manufacturer AS manufacturer
    FROM ${TABLE_ASSET} asset
    LEFT JOIN ${TABLE_MODEL} model ON model.id=asset.model_id
    LEFT JOIN ${TABLE_ZONE} zone ON zone.id=asset.zone_id
    LEFT JOIN ${TABLE_TYPE} type ON type.id=model.type_id
    LEFT JOIN ${TABLE_CATEGORY} category ON category.id=type.category_id
    LEFT JOIN ${TABLE_PROJECT} project ON project.id=asset.project_id
    LEFT JOIN ${TABLE_CITY} city ON city.city_name=project.city_name `;
    var fields = Object.keys(values);
    var args = [];
    var i = 0;
    query += " WHERE (project.deleted_at IS NULL OR asset.project_id IS NULL)";
    fields.forEach(field => {
        if (i === 0) query += " AND ";
        switch(field) {
            case 'category_asset':
                query += `category.name=$${i+1}`;
                break;
            case 'model_txt':
                query += `model.name=$${i+1}`;
                break;
            case 'type_asset':
                query += `type.code=$${i + 1}`;
                break; 
            case 'model_code':
                query += `model.code=$${i + 1}`;
                break;
            default:
                query += `asset.${field}=$${i + 1}`;
                break;
        }
        args.push(values[field]);
        i++;
        if (i < fields.length) query += " AND ";
    });
    return client.query(query, args);
};

exports.getAllByZones = function (values) {
    let query = `SELECT asset.codification_id, asset.latitude,
        asset.longitude, asset.model_id,
        asset.status, asset.eol_at AS date_end_of_life,
        asset.warranty_until AS warranty_until,
        asset.configurations, asset.img_url,
        asset.notes AS asset_notes, asset.ip_address,
        asset.vehicle_plate, asset.vehicle_plate_ar,
        asset.vehicle_brand, asset.vehicle_brand_ar,
        asset.vehicle_country, asset.vehicle_country_ar,
        asset.status_vehicle, asset.project_id,
        asset.zone_id, asset.parking_id,
        asset.carpark_id, asset.carpark_zone_id,
        asset.deployed_at AS date_deployed,
        asset.created_by, asset.created_at AS date_created,
        model.code AS model_code,
        model.name AS model_txt,
        model.img_url AS model_img_url,
        model.firmware_version,
        zone.zone_code AS zone_code, zone.zone_name AS zone_txt,
    type.name AS type_asset, project.project_name AS project_name, model.manufacturer AS manufacturer
    FROM ${TABLE_ASSET} asset
    LEFT JOIN ${TABLE_MODEL} model ON model.id=asset.model_id
    LEFT JOIN ${TABLE_ZONE} zone ON zone.id=asset.zone_id
    LEFT JOIN ${TABLE_TYPE} type ON type.id=model.type_id
    LEFT JOIN ${TABLE_PROJECT} project ON project.id=asset.project_id 
    LEFT JOIN ${TABLE_CITY} city ON city.city_name=project.city_name `;

    const fields = Object.keys(values);
    const args = [];
    query += " WHERE (project.deleted_at IS NULL OR asset.project_id IS NULL)";
    fields.forEach((field, i) => {
        if (i === 0) query += " AND ";
        switch(field) {
            case 'model_txt':
                query += `model.name=$${i+1}`;
                break;
            case 'type_asset':
                query += `type.name=$${i + 1}`;
                break; 
            case 'model_code':
                query += `model.code=$${i + 1}`;
                break;
            case 'project_id':
                query += `asset.${field}=$${i+1}`;
                break;
            case 'status':
                query += `asset.${field}=$${i+1}`;
                break;
            default:
                query += `${field}=$${i + 1}`;
                break;
        }
        args.push(values[field]);
        if (i < fields.length-1) query += " AND ";
    });
    return client.query(query, args);
};

exports.getModels = function (values) {
    let query = `select distinct name AS model from ${TABLE_MODEL} `;
    var fields = Object.keys(values);
    var args = [];
    var i = 0;
    fields.forEach(field => {
        if (i == 0) query += "WHERE ";
        query += `${field} = ${(i + 1)}`;
        args.push(values[field]);
        i++;
        if (i < fields.length) query += " AND ";
    });
    return client.query(query, args);
};

exports.getAvailable = function (values) {
    let query = `SELECT asset.codification_id, asset.latitude,
    asset.longitude, asset.model_id,
    asset.status, asset.eol_at AS date_end_of_life,
    asset.warranty_until AS warranty_until,
    asset.configurations, asset.img_url,
    asset.notes AS asset_notes, asset.ip_address,
    asset.vehicle_plate, asset.vehicle_plate_ar,
    asset.vehicle_brand, asset.vehicle_brand_ar,
    asset.vehicle_country, asset.vehicle_country_ar,
    asset.status_vehicle, asset.project_id,
    asset.zone_id, asset.parking_id,
    asset.carpark_id, asset.carpark_zone_id,
    asset.deployed_at AS date_deployed,
    asset.created_by, asset.created_at AS date_created,
    model.code AS model_code, model.name AS model_txt,
    model.firmware_version,
    zone.zone_code AS zone_code, zone.zone_name AS zone_txt,
    type.name AS type_asset, project.project_name AS project_name, model.manufacturer AS manufacturer
    FROM ${TABLE_ASSET} asset
    LEFT JOIN ${TABLE_MODEL} model ON model.id=asset.model_id
    LEFT JOIN ${TABLE_ZONE} zone ON zone.id=asset.zone_id
    LEFT JOIN ${TABLE_TYPE} type ON type.id=model.type_id
    LEFT JOIN ${TABLE_PROJECT} project ON project.id=asset.project_id 
    LEFT JOIN ${TABLE_CITY} city ON city.city_name=project.city_name 
    WHERE asset.status='Available' AND (project.deleted_at IS NULL OR asset.project_id IS NULL) `;

    let args = [];
    Object.keys(values).forEach((field, i, fields) => {
        if (i === 0) query += "AND ";
        switch(field) {
            case 'model_txt':
                query += `model.name=$${i+1}`;
                break;
            case 'type_asset':
                query += `type.name=$${i + 1}`;
                break; 
            case 'model_code':
                query += `model.code=$${i + 1}`;
                break;
            case 'project_id':
                query += `asset.${field}=$${i+1}`;
                break;
            case 'status':
                query += `asset.${field}=$${i+1}`;
                break;
            default:
                query += `${field}=$${i + 1}`;
                break;
        }
        args.push(values[field]);
        if (i < fields.length - 1) query += ' AND ';
    });
    return client.query(query, args);
};

exports.getDevices = function (values, type_asset) {
    let query = `SELECT asset.codification_id, asset.latitude,
    asset.longitude, asset.model_id,
    asset.status, asset.eol_at AS date_end_of_life,
    asset.warranty_until AS warranty_until,
    asset.configurations, asset.img_url,
    asset.notes AS asset_notes, asset.ip_address,
    asset.vehicle_plate, asset.vehicle_plate_ar,
    asset.vehicle_brand, asset.vehicle_brand_ar,
    asset.vehicle_country, asset.vehicle_country_ar,
    asset.status_vehicle, asset.project_id,
    asset.zone_id, asset.parking_id,
    asset.carpark_id, asset.carpark_zone_id,
    asset.deployed_at AS date_deployed,
    asset.created_by, asset.created_at AS date_created,
    model.code AS model_code, model.name AS model_txt,
    model.firmware_version,
    zone.zone_code AS zone_code, zone.zone_name AS zone_txt,
    type.name AS type_asset, project.project_name AS project_name, model.manufacturer AS manufacturer
    FROM ${TABLE_ASSET} asset
    LEFT JOIN ${TABLE_MODEL} model ON model.id=asset.model_id
    LEFT JOIN ${TABLE_ZONE} zone ON zone.id=asset.zone_id
    LEFT JOIN ${TABLE_TYPE} type ON type.id=model.type_id
    LEFT JOIN ${TABLE_PROJECT} project ON project.id=asset.project_id 
    LEFT JOIN ${TABLE_CITY} city ON city.city_name=project.city_name 
    WHERE (project.deleted_at IS NULL OR asset.project_id IS NULL) `;

    const args = [];
    type_asset.forEach((field, index, fields) => {
        if (index === 0) {
            query += ' AND type.name in ( ';
        }
        query += index < (fields.length - 1) ? `\$${index + 1}, ` : `\$${index + 1}) `
    });
    args.push(...type_asset);
    Object.keys(values).forEach((field, index, fields) => {
        if (index === 0) {
            query += "AND "
        }
        query += index < (fields.length - 1) ?
            `asset.${field} = \$${type_asset.length + index + 1} AND ` :
            `asset.${field} = \$${type_asset.length + index + 1}`;
        args.push(values[field]);
    });
    return client.query(query, args);
};

exports.delete = function (id) {
    const query = `delete from ${TABLE_ASSET} where codification_id = $1`;
    return client.query(query, [id]);
};

exports.update = function (id, body) {
    let updates = [];
    const modelId = body['model_txt'] ? `(SELECT model.id FROM ${TABLE_MODEL} model WHERE model.name='${body['model_txt']}')` : null;
    const zoneId = body['zone_txt'] ? `(SELECT zone.id FROM ${TABLE_ZONE} zone WHERE zone.zone_name='${body['zone_txt']}')` : null;
    const sets = [];
    Object.keys(body)
        .filter(field => (
            field !== 'id' &&
            field !== 'date_created' && field !== 'type_asset' &&
            field !== 'model_code' && field !== 'city_txt' &&
            field !== 'manufacturer' && field !== 'model_txt' &&
            field !== 'firmware_version' && field !== 'project_name' &&
            field !== 'zone_code' && field !== 'city_txt' && field !== 'zone_id' && field !== 'deployed_at'
            ))
        .forEach(field => {
            if (body.hasOwnProperty(field) && field !== 'id') {
                const fieldName = field === 'date_end_of_life' ? 'eol_at' :
                field === 'product_warranty' ? 'warranty_until' :
                field === 'asset_notes' ? 'notes' :
                field === 'date_deployed' ? 'deployed_at' :
                field === 'zone_txt' ? 'zone_id' :
                field;
                
                if (field === 'model_txt') {
                    sets.push(`${fieldName} = ${modelId}`);
                } else if (field === 'zone_txt') {
                    sets.push(`${fieldName} = ${zoneId}`);
                } else if (field === 'project_id') {
                    if (body[field] === 0) {
                        sets.push(`${field} = null`);
                    } else {
                        sets.push(`${field} = ${body[field]}`);
                    }
                } else {
                    if (!body[field]) {
                        sets.push(`${fieldName} = ${body[field]}`);
                    } else {
                        if (typeof body[field] === 'string') {
                            sets.push(`${fieldName} = '${body[field]}'`);
                        } else {
                            sets.push(`${fieldName} = ${body[field]}`);
                        }
                    }
                }
            }
    });
    let query = `update ${TABLE_ASSET} set ${sets.toString()} where codification_id = '${id}'`;
    return client.query(query).catch(e => {
        console.log(e.toString());
    });
};

exports.getStats = function (values) {
    let stats = [];
    var fields = Object.keys(values);
    if (values['project_id'] !== undefined) {
        fields.forEach(field => {
            if (field !== 'project_id') {
                // Model Count
                stats.push(client.query(`select count(*) from ${TABLE_MODEL} where 
                type_id=(SELECT id FROM ${TABLE_TYPE} WHERE code = $1)`, [values[field]]));
                // total
                stats.push(client.query(`select count(*) from ${TABLE_ASSET} asset where 
                model_id IN (SELECT id FROM ${TABLE_MODEL} WHERE 
                    type_id=(SELECT id FROM ${TABLE_TYPE} WHERE code = $1)) and asset.project_id = $2`, [values[field], values['project_id']]));
                // installed
                stats.push(client.query(`select count(*) from ${TABLE_ASSET} asset where 
                model_id IN (SELECT id FROM ${TABLE_MODEL} WHERE 
                    type_id=(SELECT id FROM ${TABLE_TYPE} WHERE code = $1)) and status = 'Installed' and asset.project_id = $2`, [values[field], values['project_id']]));
                // available
                stats.push(client.query(`select count(*) from ${TABLE_ASSET} asset where 
                model_id IN (SELECT id FROM ${TABLE_MODEL} WHERE 
                    type_id=(SELECT id FROM ${TABLE_TYPE} WHERE code = $1)) and status = 'Available' and asset.project_id = $2`, [values[field], values['project_id']]));
            }
        });
    } else {
        fields.forEach ( field => {
            // Model Count
            stats.push(client.query(`select count(*) from ${TABLE_MODEL} where 
            type_id=(SELECT id FROM ${TABLE_TYPE} WHERE code = $1)`, [values[field]]));
            // total
            stats.push(client.query(`select count(*) from ${TABLE_ASSET} where 
            model_id IN (SELECT id FROM ${TABLE_MODEL} WHERE 
                type_id=(SELECT id FROM ${TABLE_TYPE} WHERE code = $1)) `, [values[field]]));
            // installed
            stats.push(client.query(`select count(*) from ${TABLE_ASSET} where 
            model_id IN (SELECT id FROM ${TABLE_MODEL} WHERE 
                type_id=(SELECT id FROM ${TABLE_TYPE} WHERE code = $1)) and status = 'Installed'`, [values[field]]));
            // available
            stats.push(client.query(`select count(*) from ${TABLE_ASSET} where 
            model_id IN (SELECT id FROM ${TABLE_MODEL} WHERE 
                type_id=(SELECT id FROM ${TABLE_TYPE} WHERE code = $1)) and status = 'Available'`, [values[field]]));
        });
    }
    return Promise.all(stats);
};
