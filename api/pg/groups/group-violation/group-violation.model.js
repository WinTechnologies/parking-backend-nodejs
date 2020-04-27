const client = require('../../../../helpers/postgresClient');
const TABLE_ASSIGNMENT = 'group_violation';
const TABLE_VIOLATION = 'violation';
const TABLE_PROJECT = 'project';
const TABLE_CONTRAVENTION  = 'contravention';

exports.create = function(body, created_by) {
    let columns = 'id, created_at, created_by';
    let values = 'default, current_timestamp, $1';
    const args = [created_by];

    Object.keys(body).forEach((field, index, fields) => {
        columns += `, ${field}`;
        values += `, $${index + 2}`;
        args.push(body[field]);
    });
    const query = `INSERT INTO ${TABLE_ASSIGNMENT} (${columns}) VALUES (${values}) returning id`;
    return client.query(query, args);
};

exports.getAll = function(values) {
    let query = `SELECT * from ${TABLE_ASSIGNMENT} `;
    const args = [];
    query+='WHERE deleted_at is null AND deleted_by is null ';
    Object.keys(values).forEach((field, index, fields) => {
        query += ` AND ${field} = $${index+1}`;
        args.push(values[field]);
    });
    return client.query(query, args);
};

exports.getAllDetails = function(values) {
    let query = `SELECT
                    assignment.id as assignment_id,
                    violation.icon_url,
                    violation.violation_code,
                    violation.violation_name_en,
                    violation.violation_name_ar,
                    violation.is_nonpayment,
                    project.project_name,
                    assignment.value,
                    assignment.working_days,
                    assignment.date_start,
                    assignment.date_end,
                    assignment.working_timeslot,
                    assignment.service_fee,
                    CASE
                        WHEN assignment.action_tow THEN 'Tow'
                        WHEN assignment.action_clamp THEN 'Clamp'
                        WHEN assignment.action_tow = false
                              AND assignment.action_clamp = false
                              AND (assignment.observation_min = 0 OR assignment.observation_min IS NULL)
                          THEN 'Direct Ticket'
                        WHEN assignment.action_tow = false
                              AND assignment.action_clamp = false
                              AND (assignment.observation_min != 0 OR assignment.observation_min IS NOT NULL)
                          THEN 'Observation'
                    END AS assignment_action,
                    CASE
                        WHEN assignment.date_end < now()::date THEN 'Expired'
                        ELSE 'Valid'
                    END as assignment_status,
                    CASE
                      WHEN EXISTS( SELECT *
                                FROM ${TABLE_CONTRAVENTION} cn
                                WHERE cn.violation_id = assignment.violation_id)
                          THEN 'false'
                      ELSE 'true'
                    END as can_delete
                  from ${TABLE_ASSIGNMENT} as assignment,
                  ${TABLE_VIOLATION} as violation,
                  ${TABLE_PROJECT} as project
                  where assignment.violation_id = violation.id
                  and violation.project_id = project.id
                  and assignment.deleted_at is null
                  and assignment.deleted_by is null`;

    const args = [];

    Object.keys(values).forEach((field, index, fields) => {
        if (field === 'project_id') {
            query += ` and project.id = $${index + 1} `;
        } else {
            query += ` and assignment.${field} = $${index + 1} `;
        }
        args.push(values[field]);
    });

    return client.query(query, args);
};

exports.getOne = function(id) {
    const query = `SELECT * FROM ${TABLE_ASSIGNMENT} WHERE id = $1`;
    return client.query(query, [id]);
};

exports.delete = function(id, deleted_by) {
    const query = `UPDATE ${TABLE_ASSIGNMENT} SET deleted_at = current_timestamp, deleted_by = $1 WHERE id = $2`;
    return client.query(query, [deleted_by, id]);
};

exports.delByQuery = function(params, deleted_by) {
    let query = `UPDATE ${TABLE_ASSIGNMENT} SET deleted_at = current_timestamp, deleted_by = $1 WHERE `;
    const args = [deleted_by];

    Object.keys(params).forEach((field, index, fields) => {
        query += index < (fields.length-1) ? `${field} = $${index + 2} and ` : `${field} = $${index + 2}`;
        args.push(params[field]);
    });
    return client.query(query, args);
};

exports.update = function(id, body) {
    let updates = [];
    for (let field in body) {
        if (body[field] !== undefined && field !== 'id') {
            updates.push(client.query(`UPDATE ${TABLE_ASSIGNMENT} SET ${field} = $1 WHERE id = $2`, [body[field], id]));
        }
    }
    return Promise.all(updates);
};
