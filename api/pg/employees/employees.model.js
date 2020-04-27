var config = require('../../../config/database');
var bcrypt = require('bcryptjs');
const client = require('../../../helpers/postgresClient');
const TABLE_EMPLOYEE = 'employee';
const TABLE_LIST_ENFORCER_STATUS = 'list_enforcer_status';

exports.create = function(body) {
    let query = `INSERT INTO ${TABLE_EMPLOYEE} (
          employee_id,
          firstname,
          lastname,
          phone_number,
          job_position,
          job_type,
          address,
          date_start,
          date_end,
          department,
          img_url,
          landline,
          email,
          sex,
          day_of_birth,
          marital_status,
          username,
          created_at,
          created_by )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`;

    const args = [
        body.employee_id ,
        body.firstname  ,
        body.lastname    ,
        body.phone_number ,
        body.job_position ,
        body.job_type ,
        body.address       ,
        body.date_start   ,
        body.date_end     ,
        body.department   ,
        body.img_url      ,
        body.landline     ,
        body.email        ,
        body.sex          ,
        body.day_of_birth ,
        body.marital_status,
        body.username,
        body.created_at,
        body.created_by,
    ];

    return client.query(query, args);
};

exports.getAll = function(values) {
    let query = `SELECT * FROM ${TABLE_EMPLOYEE} `;
    const fields = Object.keys(values);
    const args = [];
    let i = 0;

    fields.forEach(x => {
        if(i === 0) {
            query += `WHERE `;
        }
        query += `${x} = $${(i + 1)} `;
        args.push(values[x]);
        i++;
        if(i < fields.length) {
            query += ` AND `;
        }
    });
    return client.query(query, args);
};

exports.getOne = function(employeeId) {
    const query = `
        SELECT employee.*,
               statuses.name_en AS working_status
        FROM ${TABLE_EMPLOYEE} employee
        LEFT JOIN ${TABLE_LIST_ENFORCER_STATUS} statuses
            ON statuses.id = employee.status_id AND statuses.type_job_id IS NULL
        WHERE employee_id = $1
    `;
    return client.query(query, [employeeId]);
};

exports.getWithProjects = function(values) {
    var query = `SELECT
                    employee.*,
                    coalesce(project.project_name, '') as project_name
                  FROM employee
                  LEFT JOIN project_employee ON employee.employee_id = project_employee.employee_id
                  LEFT JOIN project ON project_employee.project_id = project.id `;

    var fields = Object.keys(values);
    var args = [];
    var i = 0;

    fields.forEach(x => {
        if(i === 0) query += "WHERE ";
        query += x + " = $" + (i + 1);
        args.push(values[x]);
        i++;
        if(i < fields.length) query += " AND ";
    });
    return client.query(query, args);

};

exports.getDepartments = function () {
    var query = `SELECT distinct department FROM ${TABLE_EMPLOYEE}` ;
    var args = [];
    return client.query(query, args);
};

exports.getPositions = function (values) {
    var query = `SELECT distinct job_position FROM ${TABLE_EMPLOYEE} WHERE department = $1`;
    var fields = Object.values(values);
    var args = [];
    let val = '';

    fields.forEach(x => {
        val += x;
    });
    args.push(val);
    return client.query(query, args);
};

exports.getStatus = function () {
    var query = `SELECT distinct marital_status FROM ${TABLE_EMPLOYEE}`;
    var args = [];
    return client.query(query, args);
};

exports.delete = function(id) {
    const query = `DELETE FROM ${TABLE_EMPLOYEE} WHERE id = $1`;
    return client.query(query, [id]);
};

exports.update = function(id, body) {
    let updates = [];
    for(let field in body){
        if(body.hasOwnProperty(field) && body[field] && field !== 'id'){
            if(field !== 'password') {
                updates.push(client.query(`UPDATE ${TABLE_EMPLOYEE} SET ${field} = $1 WHERE id = $2`, [body[field], id]));
            } else {
                const salt = config.secret;
                const hash = bcrypt.hashSync(body[field], salt);
                updates.push(client.query(`UPDATE ${TABLE_EMPLOYEE} SET ${field} = $1 WHERE id = $2`, [hash, id]));
            }
        }
    }
    return Promise.all(updates);
};

exports.getEmployeesCount = function() {
    const sql = `SELECT count(*) as count FROM ${TABLE_EMPLOYEE}`;
    return client.query(sql);
};
