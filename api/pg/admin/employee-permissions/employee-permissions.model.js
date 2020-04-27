const client = require('../../../../helpers/postgresClient');
const moment = require('moment');

const EMPLOYEE_PERMISSION_TABLE = 'employee_permission';
const PERMISSION_TEMPLATE_TABLE = 'permission_template';
const EMPLOYEE_TABLE = 'employee';
const PROJECT_TABLE = 'project';
const PROJECT_EMPLOYEE_TABLE = 'project_employee';

const create = (body) => {
    let query = `insert into ${EMPLOYEE_PERMISSION_TABLE}`;
    query += ' (employee_id, permission_template_id, date_created)';
    query += ' values ($1, $2, $3)';
    const args = [
        body.employee_id,
        body.permission_template_id,
        moment().format('YYYY-MM-DD HH:mm:ss.SSS')
    ];

    return client.query(query, args);
};

const createBulk = (employees, permission_template_id) => {
    const promises = [];
    employees.forEach(employee_id => {
        promises.push(create({employee_id, permission_template_id}));
    });
    return Promise.all(promises);
};

const getAll = (params) => {
    let args = [];
    let query = `select et.* from ${EMPLOYEE_TABLE} et, ${EMPLOYEE_PERMISSION_TABLE} ept`;
    query += ` where et.employee_id = ept.employee_id `;

    Object.keys(params).forEach((field, index, fields) => {
        if(index < fields.length) query +=  ' and ';
        query += ` ept.${field} = \$${index + 1}`;
        args.push(params[field]);
    });
    return client.query(query, args);
};

const getAllWithTemplate = (params) => {
    let args = [];
    let query = `select * from ${EMPLOYEE_PERMISSION_TABLE} ept, ${PERMISSION_TEMPLATE_TABLE} ptt`;
    query += ` where ept.permission_template_id = ptt.id`;

    Object.keys(params).forEach((field, index, fields) => {
        if(index < fields.length) query +=  ' and ';
        query += ` ept.${field} = \$${index + 1}`;
        args.push(params[field]);
    });
    return client.query(query, args);
};

const getEmployeesByPermissions = (params) => {
    let query = '';
    let queryTables = `${EMPLOYEE_TABLE} et`;
    let queryWhere = '';

    if (params.projectId !== undefined) {
        queryTables += `, ${PROJECT_EMPLOYEE_TABLE} pet, ${PROJECT_TABLE} pt`;
        queryWhere += 'et.employee_id = pet.employee_id and pet.project_id = pt.id';
        queryWhere += ` and pt.id = ${params.projectId}`;
        delete params.projectId;
    }

    const permissionFeatures = Object.keys(params);
    if (permissionFeatures.length > 0) {
        queryTables += `, ${EMPLOYEE_PERMISSION_TABLE} ept, ${PERMISSION_TEMPLATE_TABLE} ptt`;
        queryWhere += !queryWhere ? '' : ' and   ';
        queryWhere += 'et.employee_id = ept.employee_id and ept.permission_template_id = ptt.id';
        permissionFeatures.forEach((field) => {
            if (Array.isArray(params[field])) {
                queryWhere += ` and ptt.${field} in ('${params[field].join("','")}')`;
            } else {
                queryWhere += ` and ptt.${field} = '${params[field]}'`;
            }
        });
    }

    query = `select distinct et.* from ${queryTables}`;
    if (queryWhere) {
        query += ` where ${queryWhere}`;
    }

    return client.query(query, []);
};

const getOne = (employee_id) => {
    const query = `select et.* from ${EMPLOYEE_TABLE} et, ${EMPLOYEE_PERMISSION_TABLE} ept 
          where et.employee_id = ept.employee_id and ept.employee_id = $1`;
    return client.query(query, [employee_id]);
};

const getOneWithTemplate = (employee_id) => {
    const query = `SELECT ptt.* FROM ${EMPLOYEE_PERMISSION_TABLE} ept, ${PERMISSION_TEMPLATE_TABLE} ptt 
        WHERE ept.employee_id = $1 AND ept.permission_template_id = ptt.id`;
    return client.query(query, [employee_id]);
};

const del = (employee_id) => {
    const query = `delete from ${EMPLOYEE_PERMISSION_TABLE} where employee_id = $1`;
    return client.query(query, [employee_id]);
};

const delBulk = (employees) => {
    const promises = [];
    employees.forEach(employee_id => {
        promises.push(del(employee_id));
    });
    return Promise.all(promises);
};

const delByTemplate = (templateId) => {
    const query = `delete from ${EMPLOYEE_PERMISSION_TABLE} where permission_template_id = $1`;
    return client.query(query, [templateId]);
};

const update = (employee_id, body) => {
    const currentTimeStamp = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    let query = `update ${EMPLOYEE_PERMISSION_TABLE} set permission_template_id = $1, date_created = $2`;
    query += ` where employee_id = $3`;
    return client.query(query, [body.permission_template_id, currentTimeStamp, employee_id]);
};

const updateBulk = (employees, permission_template_id) => {
    const promises = [];
    employees.forEach(employee_id => {
        promises.push(update(employee_id, {permission_template_id}));
    });
    return Promise.all(promises);
};

const getAssignedEmployees = (permission_template_id) => {
    let query = `select * from ${EMPLOYEE_PERMISSION_TABLE} ept, ${EMPLOYEE_TABLE} et`;
    query += ` and ept.permission_template_id = $1 ept.employee_id = et.employee_id`;
    return client.query(query, [permission_template_id]);
};

exports.create = create;
exports.createBulk = createBulk;
exports.getOne = getOne;
exports.getAll = getAll;
exports.update = update;
exports.updateBulk = updateBulk;
exports.del = del;
exports.delBulk = delBulk;
exports.delByTemplate = delByTemplate;

exports.getAssignedEmployees = getAssignedEmployees;
exports.getOneWithTemplate = getOneWithTemplate;
exports.getAllWithTemplate = getAllWithTemplate;
exports.getEmployeesByPermissions = getEmployeesByPermissions;