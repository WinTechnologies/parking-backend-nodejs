const client = require('../../../helpers/postgresClient');
const TABLES = {
    department: 'list_department',
    position: 'list_position',
    job_type: 'list_type_job',
    city: 'list_city',
    vat: 'vat',
    incident: 'list_incident'
};

exports.create = function(type, body) {
    const columns = [];
    const values = [];
    const args = [];

    if (type === 'incident') {
        Object.keys(body).forEach((field, index) => {
            columns.push(field);
            values.push(`$${index + 1}`);
            args.push(body[field]);
        });
        const query = `insert into ${TABLES[type]} (${columns.toString()}) values (${values.toString()})`;
        return client.query(query, args);
    } else {
        columns.push('id');
        values.push('default');
        Object.keys(body).forEach((field, index) => {
            if (field === 'type_job_name') {
                columns.push('type_job_id');
            } else {
                columns.push(field);
            }
            values.push(`$${index + 1}`);
            args.push(body[field]);
        });
        const query = `insert into ${TABLES[type]} (${columns.toString()}) values (${values.toString()})`;
        return client.query(query, args);
    }
};

exports.getAll = function(type, params = {}) {
    let args = [];
    let query = ``;
    if (type === 'position') {
        query += `select list_position.*, list_type_job.name as type_job_name from ${TABLES[type]} left join list_type_job on list_position.type_job_id = list_type_job.id`
    } else {
        query += `select * from ${TABLES[type]}`;
    }
    Object.keys(params).forEach((field, index, fields) => {
        if(index === 0) query += ' where ';
        query += ` ${field} = \$${index + 1}`;
        args.push(params[field]);
        if(index < fields.length - 1) query +=  ' and ';
    });
    return client.query(query, args);
};

exports.getOne = function (type, id) {
    const query = `SELECT * FROM ${TABLES[type]} WHERE id = $1`;
    return client.query(query, [id]);
};

exports.delete = function(type, id) {
    const query = `delete from ${TABLES[type]} where id = $1`;
    return client.query(query, [id]);
};

exports.update = function(type, id, body) {
    let query = `update ${TABLES[type]} set `;
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
