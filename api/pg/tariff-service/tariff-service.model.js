const client = require('../../../helpers/postgresClient');
const TABLE_SERVICE = "service";

exports.create = function(body) {
    var query = `INSERT INTO ${TABLE_SERVICE} (
        service_name_en,
        service_name_ar,
        fee,
        img_url,
        working_days,
        working_timeslot,
        decription,
        term_conditions,
        date_created
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;

    var args = [
        body.service_name_en,
        body.service_name_ar,
        body.fee,
        body.img_url,
        body.working_days,
        body.working_timeslot,
        body.decription,
        body.term_conditions,
        body.date_created,
    ];

    return client.query(query, args);
};

exports.getAll = function(values) {
    var query = `select * from ${TABLE_SERVICE} `;
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
    const query = `delete from ${TABLE_SERVICE} where id = $1`;
    return client.query(query, [id]);
};

exports.update = function(id, body) {
    let updates = [];
    for(let field in body){
        if(body.hasOwnProperty(field) && body[field] !== null && field !== 'id'){
            updates.push(client.query(`update ${TABLE_SERVICE} set ${field} = $1 where id = $2`, [body[field], id]));
        }
    }
    return Promise.all(updates);
};
