const client = require('../../../helpers/postgresClient');
const EMPLOYEE_WP_TABLE = 'employee_wp';
const EMPLOYEE_TABLE = 'employee';
const WORKPLAN_TABLE = 'workplan';

exports.create = function(body, createdBy) {
    let query = `INSERT INTO ${EMPLOYEE_WP_TABLE} 
        ( employee_id, workplan_id, wp_reoccuring_id, wp_exception_id, created_by, created_at) 
        VALUES `;
    const args = [];

    if(body.length) {
        for (let index = 0, param_index = 1; index < body.length; index++, param_index += 5) {
            let data = body[index];
            if(index === 0) {
                query += ` ($${param_index}, $${param_index+1}, $${param_index+2}, $${param_index+3}, $${param_index+4}, now())`;

            } else {
                query += `, ($${param_index}, $${param_index+1}, $${param_index+2}, $${param_index+3}, $${param_index+4}, now())`;
            }
            args.push(
                data.employee_id,
                data.workplan_id,
                data.wp_reoccuring_id,
                data.wp_exception_id,
                createdBy,
            );
        }
        return client.query(query, args);
    }
};

exports.getAll = function(values) {
    let query = `SELECT * FROM ${EMPLOYEE_WP_TABLE} `;
    const fields = Object.keys(values);
    let args = [];
    let i = 0;

    fields.forEach(x => {
        if(i === 0) query += `WHERE `;
        query += ` ${x} = $${(i + 1)} `;
        args.push(values[x]);
        i++;
        if(i < fields.length) {
            query += ` AND `;
        }
    });
    return client.query(query, args);
};

exports.getEmployees = function(values) {
    let query = `SELECT DISTINCT ${EMPLOYEE_TABLE}.* 
        FROM ${EMPLOYEE_TABLE} 
        LEFT JOIN ${EMPLOYEE_WP_TABLE} ON ${EMPLOYEE_WP_TABLE}.employee_id = ${EMPLOYEE_TABLE}.employee_id
        LEFT JOIN ${WORKPLAN_TABLE} ON ${WORKPLAN_TABLE}.id = ${EMPLOYEE_WP_TABLE}.workplan_id `;
    const fields = Object.keys(values);
    let args = [];
    let i = 0;

    fields.forEach(x => {
        if(i === 0) query += `WHERE `;
        query += ` ${x} = $${(i + 1)} `;
        args.push(values[x]);
        i++;
        if(i < fields.length) query += ` AND `;
    });
    return client.query(query, args);
};

exports.delete = function(workplan_id) {
    const query = `DELETE FROM ${EMPLOYEE_WP_TABLE} WHERE workplan_id = $1`;
    return client.query(query, [workplan_id]);
};

exports.update = function(id, body) {
    let updates = [];
    for(let field in body){
        if(body.hasOwnProperty(field) && body[field] && field !== 'id'){
            updates.push(client.query(`UPDATE ${EMPLOYEE_WP_TABLE} SET ${field} = $1 WHERE id = $2`, [body[field], id]));
        }
    }
    return Promise.all(updates);
};

exports.updateWPReoccurings = function(workplan_id, reoccurings) {
    let query = `UPDATE ${EMPLOYEE_WP_TABLE} SET wp_reoccuring_id = '${reoccurings}' WHERE workplan_id = ${workplan_id}`;
    return client.query(query);
};

exports.updateEmployeeReoccurings = function(employee_id, reoccurings) {
    let query = `UPDATE ${EMPLOYEE_WP_TABLE} SET wp_reoccuring_id = '${reoccurings}' WHERE employee_id = '${employee_id}'`;
    return client.query(query);
};

exports.updateWPExceptions = function(workplan_id, exceptions) {
    let query = `UPDATE ${EMPLOYEE_WP_TABLE} SET wp_exception_id = '${exceptions}' WHERE workplan_id = ${workplan_id}`;
    return client.query(query);
};

exports.updateEmployeeExceptions = function(employee_id, exceptions) {
    let query = `UPDATE ${EMPLOYEE_WP_TABLE} SET wp_exception_id = '${exceptions}' WHERE employee_id = '${employee_id}'`;
    return client.query(query);
};

exports.deleteByEmployeeId = function(employee_id) {
    const query = `DELETE FROM ${EMPLOYEE_WP_TABLE} WHERE employee_id = $1`;
    return client.query(query, [employee_id]);
};

exports.getUnassignedEmployees = function(values) {
    const query = `SELECT e.* FROM ${EMPLOYEE_TABLE} AS e
        LEFT JOIN ${EMPLOYEE_WP_TABLE} AS w on e.employee_id =  w.employee_id 
        WHERE w.employee_id ISNULL `;
    return client.query(query);
};
