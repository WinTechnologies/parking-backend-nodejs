const client = require('../../../helpers/postgresClient');
const TABLE_NAME = "project_activity";

exports.create = function(body) {
    var query = "INSERT INTO " + TABLE_NAME +
     " (has_on_street, has_car_park, has_enforcement, has_taxi_management, "
     + "has_valet_parking, has_rental_car, project_id, created_at)" +
     " VALUES ($1, $2, $3, $4, $5, $6, $7, $8)";
    var args = [
        body.has_on_street,
        body.has_car_park,
        body.has_enforcement,
        body.has_taxi_management,
        body.has_valet_parking,
        body.has_rental_car,
        body.project_id,
        body.created_at
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
    const query = "delete from " + TABLE_NAME + " where id = "+ id;
    return client.query(query);
};

exports.update = function(id, body) {
    let updates = [];
    for(let field in body){
        if(body.hasOwnProperty(field) && body[field] !== null && body[field] !== undefined && field !== 'id'){
            updates.push(client.query("update " + TABLE_NAME + " set " + field + "= $1 where id = $2", [body[field], id]));
        }
    }
    return Promise.all(updates);
};