const client = require('../../../helpers/postgresClient');
const TABLE_ESCALATION = 'escalation';

exports.create = function(body, created_by) {
    var query = "INSERT INTO " + TABLE_ESCALATION
    + " (escalation_name, outstanding_violation_nbr, outstanding_violation_tow, outstanding_violation_clamp, outstanding_days_nbr,"
    + " outstanding_days_tow, outstanding_days_clamp, logical_rule, fee_tow, fee_clamp, storage_fee, storage_fee_unit, storage_max,"
    + " storage_max_unit, applied_immediately, applied_after, project_id, applied_after_unit, zones, created_by, created_at) " +
    " VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, current_timestamp) RETURNING *";
    var args = [
        body.escalation_name,
        body.outstanding_violation_nbr,
        body.outstanding_violation_tow,
        body.outstanding_violation_clamp,
        body.outstanding_days_nbr,
        body.outstanding_days_tow,
        body.outstanding_days_clamp,
        body.logical_rule,
        body.fee_tow,
        body.fee_clamp,
        body.storage_fee,
        body.storage_fee_unit,
        body.storage_max,
        body.storage_max_unit,
        body.applied_immediately,
        body.applied_after,
        body.project_id,
        body.applied_after_unit,
        body.zones,
        created_by
    ];
    return client.query(query, args);
};

exports.getAll = function(values) {
    let query = `select * from ${TABLE_ESCALATION} `;
    const fields = Object.keys(values);
    const args = [];

    query += " WHERE deleted_at ISNULL AND deleted_by ISNULL ";

    fields.forEach((x, i) => {
        query += ` AND ${x} = $${i+1} `;
        args.push(values[x]);
    });
    return client.query(query, args);
};

exports.delete = function(id, deleted_by) {
    // const query = "delete from " + TABLE_NAME + " where id = $1";
    const query = `update ${TABLE_ESCALATION} set deleted_at = current_timestamp, deleted_by = $1 where id = $2`;
    return client.query(query, [deleted_by, id]);
};

exports.update = function(id, body) {
    let updates = [];
    for(let field in body){
        if(body.hasOwnProperty(field) && body[field] !== undefined && field !== 'id'){
            updates.push(client.query("update " + TABLE_ESCALATION + " set " + field + " = $1 where id = $2", [body[field], id]));
        }
    }
    return Promise.all(updates);
};
