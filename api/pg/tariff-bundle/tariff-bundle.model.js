const client = require('../../../helpers/postgresClient');
const TABLE_BUNDLE = 'bundle';

exports.create = function(body) {
    var query;
    var args;

    if (body.date_end) {
        query = `INSERT INTO ${TABLE_BUNDLE} (
            bundle_name_en,
            bundle_name_ar,
            fee,
            img_url,
            working_days,
            working_timeslot,
            decription,
            term_conditions,
            date_created,
            date_start,
            date_end
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;

        args = [
            body.bundle_name_en,
            body.bundle_name_ar,
            body.fee,
            body.img_url,
            body.working_days,
            body.working_timeslot,
            body.decription,
            body.term_conditions,
            body.date_created,
            body.date_start,
            body.date_end,
        ];
    } else {
        query = `INSERT INTO ${TABLE_BUNDLE} (
            bundle_name_en,
            bundle_name_ar,
            fee,
            img_url,
            working_days,
            working_timeslot,
            decription,
            term_conditions,
            date_created,
            date_start
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;

        args = [
            body.bundle_name_en,
            body.bundle_name_ar,
            body.fee,
            body.img_url,
            body.working_days,
            body.working_timeslot,
            body.decription,
            body.term_conditions,
            body.date_created,
            body.date_start,
        ];
    }

    return client.query(query, args);
};

exports.getAll = function(values) {
    var query = `select * from ${TABLE_BUNDLE} `;
    var fields = Object.keys(values);
    var args = [];
    var i = 0;

    fields.forEach(x => {
        if(i == 0) query += "WHERE ";
        query += x + " = $" + (i + 1);
        args.push(values[x]);
        i++;
        if(i < fields.length) query += " AND ";
    });
    return client.query(query, args);

};

exports.delete = function(id) {
    const query = `delete from ${TABLE_BUNDLE} where id = $1`;
    return client.query(query, [id]);
};

exports.update = function(id, body) {
    let updates = [];
    for(let field in body){
        if(body.hasOwnProperty(field) && body[field] !== null  && field !== 'id'){
            updates.push(client.query(`update ${TABLE_BUNDLE} set ${field} = $1 where id = $2`, [body[field], id]));
        }
    }
    return Promise.all(updates);
};
