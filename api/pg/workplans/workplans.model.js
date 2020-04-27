const client = require('../../../helpers/postgresClient');
const WP_TABLE = "workplan";
const WP_REOCCURING_TABLE = "wp_reoccuring";
const WP_EXCEPTION_TABLE = "wp_exception";

exports.create = function(data) {
    const query = `INSERT INTO ${WP_TABLE} (wp_name, location, country_code, description, date_start, date_end, created_by, created_at)
          VALUES($1, $2, $3, $4, $5, $6, $7, now()) RETURNING *`;
    const args = [
        data.wp_name,
        data.location,
        data.country_code,
        data.description,
        data.date_start,
        data.date_end ? data.date_end : null,
        data.created_by,
    ];

    return client.query(query, args);
};

exports.getAll = function(values) {
    // `SELECT wp.*, occ.*, exp.*, emp.*
    // FROM workplan AS wp
    // LEFT JOIN employee_wp AS emp_wp ON wp.id = emp_wp.workplan_id
    // LEFT JOIN employee AS emp ON emp.employee_id = emp_wp.employee_id
    // LEFT JOIN wp_reoccuring AS occ ON wp.id = occ.workplan_id
    // LEFT JOIN wp_exception AS exp ON wp.id = exp.workplan_id
    // WHERE wp.wp_name = ${test}`;

    let query = `SELECT * FROM ${WP_TABLE} `;
    const fields = Object.keys(values);
    const args = [];
    let i = 0;

    if(fields.length === 0) {
        query += `WHERE deleted_by ISNULL `;
    } else {
        query += `WHERE deleted_by ISNULL AND `;
    }
    fields.forEach(x => {
        query += `${x} = $${(i + 1)}`;
        args.push(values[x]);
        i++;
        if(i < fields.length) {
            query += ` AND `;
        }
    });
    return client.query(query, args);
};

exports.delete = function(wp_name) {
    const query = "delete from " + WP_TABLE + " where wp_name = $1";
    return client.query(query, [wp_name]);
};

exports.update = function(wp_name, values) {
    let query = `UPDATE ${WP_TABLE} SET `;
    const fields = Object.keys(values);
    const args = [];
    let i = 0;

    fields.forEach(x => {
        query += `${x} = $${(i + 1)}`;
        args.push(values[x]);
        i++;
        if(i < fields.length) {
            query += ` , `;
        }
    });

    query += ` WHERE wp_name = $${i + 1}`;
    args.push(wp_name);

    return client.query(query, args);
};
