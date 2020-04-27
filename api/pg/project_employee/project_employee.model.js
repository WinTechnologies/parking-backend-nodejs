const client = require('../../../helpers/postgresClient');
const TABLE_PROJECT_EMPLOYEE = 'project_employee';
const TABLE_PROJECT = 'project';

exports.create = (body, assignerId) => {
    const query = `INSERT INTO ${TABLE_PROJECT_EMPLOYEE}
                        (project_id, employee_id, start_date, end_date, assigned_by)
                    VALUES ($1, $2, $3, $4, $5)`;
    const args = [
        body.project_id,
        body.employee_id,
        body.start_date,
        body.end_date,
        assignerId,
    ];

    return client.query(query, args);
};

exports.createBulk = (employees, project_id, assignerId) => {
    const query = `INSERT INTO ${TABLE_PROJECT_EMPLOYEE}
                        (project_id, employee_id, start_date, end_date, assigned_by)
                    VALUES ($1, $2, current_timestamp, $3, $4)`;

    const promises = [];
    employees.forEach(employee => {
        const args = [project_id, employee.employee_id, employee.end_date, assignerId];
        promises.push(client.query(query, args));
    });

    return Promise.all(promises);
};

/**
 * Get employees with their project info for one or more projects
 * @param values <{ project_id, ... }>
 * @returns {Promise<{...employee, project_id, project_employee_id, project_name}>}
 */
exports.getEmployeesWithProject = (values) => {
    let query = `SELECT employee.*,
                        project_employee.project_id as project_id,
                        project_employee.id as project_employee_id,
                        project.project_name as project_name
                FROM ${TABLE_PROJECT_EMPLOYEE} project_employee
                JOIN employee on project_employee.employee_id = employee.employee_id \
                JOIN project on project.id = project_employee.project_id`;
    const fields = Object.keys(values);
    const args = [];
    let i = 0;

    fields.forEach(x => {
        if (i === 0) query += ' WHERE ';
        if (x === 'project_id') {
            query += 'project_employee.project_id' + ' = $' + (i + 1);
        } else {
            query += x + ' = $' + (i + 1);
        }
        args.push(values[x]);
        i++;
        if(i < fields.length) query += ' AND ';
    });
    return client.query(query, args);

};

exports.getProjectEmployee = () => {
    const query = `SELECT * FROM ${TABLE_PROJECT_EMPLOYEE}`;
    return client.query(query, []);
};

exports.getEmployeeAssignedProjects = (employee_id) => {
    const query = `SELECT
                    project_employee.project_id as project_id,
                    project.*
                FROM  ${TABLE_PROJECT_EMPLOYEE} project_employee
                JOIN ${TABLE_PROJECT} project ON project_employee.project_id = project.id
                    AND project.deleted_at ISNULL AND project.deleted_by ISNULL
                WHERE project_employee.employee_id = '${employee_id}'`;
    return client.query(query);
};

exports.unassignEmployee = (id) => {
    const query = `UPDATE ${TABLE_PROJECT_EMPLOYEE} SET end_date = NOW() WHERE id = $1`;
    return client.query(query, [id]);
};

exports.unassignByEmployeeId = (employee_id) => {
    const query = `UPDATE ${TABLE_PROJECT_EMPLOYEE} SET end_date = NOW() WHERE employee_id = $1`;
    return client.query(query, [employee_id]);
};

exports.update = (id, body) => {
    let updates = [];
    for(let field in body){
        if(body.hasOwnProperty(field) && body[field] && field !== 'id'){
            updates.push(client.query(`UPDATE ${TABLE_PROJECT_EMPLOYEE} SET ${field} = $1 WHERE id = $2`, [body[field], id]));
        }
    }
    return Promise.all(updates);
};
