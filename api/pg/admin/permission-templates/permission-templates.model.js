const client = require('../../../../helpers/postgresClient');
const moment = require('moment');

const TABLE_NAME = 'permission_template';
const defaultTemplateId = 2; // ToDo:: It should be fixed

exports.create = (body, features) => {
    let columns = 'id, template_name, template_desc, date_created';
    let values = 'DEFAULT, $1, $2, $3';
    const currentTimeStamp = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    const args = [body.template_name, body.template_desc, currentTimeStamp];

    features.forEach((featureItem, index) => {
        columns += `, ${featureItem.feature}`;
        values += `, \$${index + 4}`; //template_name, template_desc, date_created
        args.push(body[featureItem.feature]['permission_type']);
    });
    const query = `insert into ${TABLE_NAME} (${columns}) values (${values})`;
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

exports.getOne = function (id) {
    const query = `SELECT * FROM ${TABLE_NAME} WHERE id = $1`;
    return client.query(query, [id]);
};

exports.getDefault = () => {
    const query = `SELECT * FROM ${TABLE_NAME} WHERE id = $1`;
    return client.query(query, [defaultTemplateId]);
};

exports.delete = function(id) {
    const query = `delete from ${TABLE_NAME} where id = $1`;
    return client.query(query, [id]);
};

exports.update = function(id, body) {
    let notFeatureColumns = ['id', 'template_name', 'template_desc', 'date_created'];
    let query = `update ${TABLE_NAME} set `;
    let args = [];
    delete body.id;
    Object.keys(body).forEach((field, index, fields) => {
        query += ` ${field} = \$${index + 1}`;
        if (notFeatureColumns.includes(field)) {
            args.push(body[field]);
        } else {
            args.push(body[field]['permission_type']);
        }
        if(index < fields.length - 1) query +=  ', ';
    });
    args.push(id);
    query += ` where id = \$${args.length}`;
    return client.query(query, args);
};
