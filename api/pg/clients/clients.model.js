const client = require('../../../helpers/postgresClient');
const TABLE_NAME = "client";

exports.create = function(body) {
    var query = "INSERT INTO " + TABLE_NAME + 
    " ( id, firstname, lastname, phone_number, email, address, designation, project_id)"
    + " VALUES (default, $1, $2, $3, $4, $5, $6, $7)";
    var args = [
        body.firstname,
        body.lastname,
        body.phone_number,
        body.email,
        body.address,
        body.designation,
        body.project_id
    ];

    return client.query(query, args);
};

exports.getAll = function(values) {
    var query = "select * from " + TABLE_NAME + " ";
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
    const query = "delete from " + TABLE_NAME + " where id = $1";
    return client.query(query, [id]);
};

exports.update = function(id, body) {
    let updates = [];
    for(let field in body){
        if(body.hasOwnProperty(field) && body[field]!== null && field !== 'id'){
            updates.push(client.query("update " + TABLE_NAME + " set " + field + " = $1 where id = $2", [body[field], id]));
        }
    }
    return Promise.all(updates);
};