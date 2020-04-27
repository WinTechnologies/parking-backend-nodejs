const client = require('../../../../helpers/postgresClient');
const TABLE_GROUPS = 'groups';
const TABLE_ASSIGNMENT = 'group_violation';
const TABLE_PARKING = 'parking';
const TABLE_PROJECT_ZONE = 'project_zone';
const TABLE_VIOLATION = 'violation';
const TABLE_PROJECT = 'project';

const get = (values) => {
    let query = `SELECT * FROM ${TABLE_GROUPS} `;
    const args = [];
    query += ' WHERE deleted_at ISNULL AND deleted_by ISNULL ';
    Object.keys(values).forEach((field, index, fields) => {
        query += ` AND ${field} = $${index + 1}`;
        args.push(values[field]);
    });
    return client.query(query, args);
};

const add = async (params, created_by) => {
    let query = `INSERT INTO ${TABLE_GROUPS} (
        group_name,
        date_start,
        date_end,
        working_days,
        working_timeslot,
        project_id,
        created_by,
        created_at )
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`;

    const args = [
        params.group_name,
        params.date_start,
        params.date_end,
        params.working_days,
        params.working_timeslot,
        params.project_id,
        created_by
    ];
    return client.query(query, args);
};


const edit = async (body, id) => {
    let updates = [];
    for (let field in body) {
        if (body.hasOwnProperty(field) && (body[field] !== null || field === 'date_end') && field !== 'id') {
            updates.push(client.query(`UPDATE ${TABLE_GROUPS} SET ${field} = $1 WHERE id = $2`, [body[field], id]));
        }
    }
    return Promise.all(updates);
};

const del = (id, deleted_by) => {
    const query = `UPDATE ${TABLE_GROUPS} SET deleted_at = current_timestamp, deleted_by = $1 WHERE id = $2`;
    return client.query(query, [deleted_by, id]);
};

const getZonesList = async (params) => {
    let query = `SELECT
                    z.*,
                    p.id,
                    p.zone_id,
                    p.number,
                    p.parking_code,
                    p.name,
                    p.latitude,
                    p.longitude
                  FROM  ${TABLE_PARKING} AS p,
                        ${TABLE_PROJECT_ZONE} AS z
                  WHERE p.zone_id=z.id
                    AND z.project_id=$1
                    AND p.project_id=$1`;

    return client.query(query, [params.project_id]).then(result => {
        let res = {};
        result.rows.forEach(element => {
            if (!res[element.zone_id]) {
                res[element.zone_id] = {
                    id: element.id,
                    zone_name: element.zone_name,
                    zone_id: element.zone_id,
                    zone_code: element.zone_code,
                    connecting_points: element.connecting_points,
                    list: []
                }
            }
            res[element.zone_id].list.push(element);
        });

        return Object.values(res);
    });
};

const getAssignmentsByGroup = async (params) => {
    const query = `SELECT gv.id as assignment_id,
                    v.icon_url,
                    v.violation_code,
                    v.violation_name_en,
                    v.violation_name_ar,
                    p.project_name,
                    gv.value,
                    gv.working_days,
                    gv.date_start,
                    gv.date_end,
                    gv.working_timeslot
        FROM ${TABLE_ASSIGNMENT} as gv,
             ${TABLE_VIOLATION} as v,
             ${TABLE_PROJECT} as p
        WHERE gv.violation_id=v.id
        AND v.project_id=p.id
        AND gv.group_id='${params.group_id}' AND p.id='${params.project_id}';`

    return client.query(query);
};

exports.get = get;
exports.add = add;
exports.edit = edit;
exports.del = del;
exports.getZonesList = getZonesList;
exports.getAssignmentsByGroup = getAssignmentsByGroup;
