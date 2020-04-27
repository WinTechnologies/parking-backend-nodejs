const client = require('../../../helpers/postgresClient');
const TABLE_NAME = "wp_exception";

exports.create = function(body) {
    const query = `INSERT INTO ${TABLE_NAME}
        (workplan_id, exception_name, applied_dates, timeslot_working, is_holiday, created_by, created_at)  
        VALUES ($1, $2, $3, $4, $5, $6, now())
        RETURNING id`;

    const args = [
        body.workplan_id,
        body.exception_name,
        body.applied_dates,
        body.timeslot_working,
        body.is_holiday,
        body.created_by,
    ];

    return client.query(query, args);
};

exports.bulkCreate = function(body) {
    let query = `INSERT INTO ${TABLE_NAME}
        (workplan_id, exception_name, applied_dates, timeslot_working, is_holiday, created_by, created_at)
        VALUES `;
    let args = [];

    const count = body.exceptions && body.exceptions.length ? body.exceptions.length : 0;

    for (let i = 0, param_i = 0; i < count; i++, param_i += 6)
    {
        let exception = body.exceptions[i];
        query += `($${param_i+1}, $${param_i+2}, $${param_i+3}, $${param_i+4}, $${param_i+5}, $${param_i+6}, now())`;
        if (i < count-1) {
            query += ` , `;
        }

        args.push(
            body.workplan_id,
            exception.exception_name,
            exception.applied_dates,
            exception.timeslot_working,
            exception.is_holiday,
            body.created_by,
        );
    }
    query += ` RETURNING id`;
    return client.query(query, args);
};

exports.getAll = function(values) {
    var query = "select * from " + TABLE_NAME + " ";
    var fields = Object.keys(values);
    var args = [];
    var i = 0;

    if(fields.length === 0) {
        query += `WHERE deleted_by ISNULL `;
    } else {
        query += `WHERE deleted_by ISNULL AND `;
    }
    fields.forEach(x => {
        query += x + " = $" + (i + 1);
        args.push(values[x]);
        i++;
        if(i < fields.length) {
            query += " AND ";
        }
    });
    return client.query(query, args);
};

exports.getByIdList = function(IdList) {
    const query = `select * from ${TABLE_NAME} WHERE deleted_by ISNULL AND id IN (${IdList.join(',')})`;
    return client.query(query);
};

exports.delete = function(id) {
    const query = "delete from " + TABLE_NAME + " where id = $1";
    return client.query(query, [id]);
};

exports.deleteByWP = function(workplan_id) {
    const query = "delete from " + TABLE_NAME + " where workplan_id = $1";
    return client.query(query, [workplan_id]);
};

exports.update = function(id, body) {
    let updates = [];
    for(let field in body){
        if(body.hasOwnProperty(field) && body[field] && field !== 'id'){
            updates.push(client.query("update " + TABLE_NAME + " set ${field} = $1 where id = $2", [body[field], id]));
        }
    }
    return Promise.all(updates);
};

exports.updateById = function(id, values) {
    let query = `UPDATE ${TABLE_NAME} SET `;
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

    query += ` WHERE id = $${i + 1}`;
    args.push(id);

    return client.query(query, args);
};

exports.updateByWP = function(workplan_id, values) {
    let query = `UPDATE ${TABLE_NAME} SET `;
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

    query += ` WHERE workplan_id = $${i + 1}`;
    args.push(workplan_id);

    return client.query(query, args);
};

exports.bulkUpdateByWP = function(workplan_id, values, idList) {
    let query = `UPDATE ${TABLE_NAME} SET `;
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

    query += ` WHERE workplan_id = $${i + 1} AND id IN (${idList}) `;
    args.push(workplan_id);

    return client.query(query, args);
};
