const client = require('../../../helpers/postgresClient');

const projectEmployeeTable = 'project_employee';
const employeeTable = 'employee';

const getAllInHierarchy = (project_id) => {
    let query = "select e.employee_id, p.project_id, concat(firstname, ' ', lastname) as fullname, supervisor_id, job_position as position, p.id as project_employee_id ";
    query += "from " + employeeTable + " e join ";
    query += projectEmployeeTable + " p on e.employee_id = p.employee_id ";
    query += "and p.supervisor_id is not null ";
    query += "where project_id = $1";

    return client.query(query, [project_id]);
};

const getAllNotInHierarchy = (project_id) => {
    let query = "select e.employee_id, p.project_id, concat(firstname, ' ', lastname) as fullname, supervisor_id, job_position as position, p.id as project_employee_id ";
    query += "from " + employeeTable + " e join ";
    query += projectEmployeeTable + " p on e.employee_id = p.employee_id ";
    query += "and p.supervisor_id is null ";
    query += "where project_id = $1";

    return client.query(query, [project_id]);
};

const add = ({ project_id, employee_id, supervisor_id }) => {
    const query = `update ${projectEmployeeTable} set supervisor_id = $3 where project_id = $1 and employee_id = $2`;
    const args = [project_id, employee_id, supervisor_id];
    return client.query(query, args);
};

const del = ({ project_id, employee_id }) => {
    const query = `update ${projectEmployeeTable} set supervisor_id = null where project_id = $1 and employee_id = $2`;
    return client.query(query, [project_id, employee_id]);
};

exports.getAllInHierarchy = getAllInHierarchy;
exports.getAllNotInHierarchy = getAllNotInHierarchy;
exports.add = add;
exports.del = del;