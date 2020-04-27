const client = require('../../../helpers/postgresClient');
const TABLE_NAME = "act_enforcement_prediction";
const TABLE_PROJECT = "project";

exports.create = function(body) {
    const query = "INSERT INTO " + TABLE_NAME + " (" +
      "job_position, " +
      "issuance_rate, " +
      "issuance_unity, " +
      "groupage, " +
      "forecast_unity," +
      "forecast_deployed," +
      "project_id, " +
      "forecast_per_unity, " +
      "expected_unity, " +
      "nbr_spaces_on_street_parking" +
      ") " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)";
    const args = [
        body.job_position,
        body.issuance_rate,
        body.issuance_unity,
        body.groupage,
        body.forecast_unity,
        body.forecast_deployed,
        body.project_id,
        body.forecast_per_unity,
        body.expected_unity,
        body.nbr_spaces_on_street_parking
    ];
    return client.query(query, args);
};

exports.getAll = function(values) {
    var query = "select aep.* from " + TABLE_NAME + " AS aep ";
    var fields = Object.keys(values);
    var args = [];
    var i = 0;

    query += "INNER JOIN " + TABLE_PROJECT + " AS project ON aep.project_id = project.id AND project.deleted_at IS NULL ";

    fields.forEach(x => {
        if(i === 0) query += "WHERE ";
        query += "aep." + x + " = $" + (i + 1);
        args.push(values[x]);
        i++;
        if(i < fields.length) query += " AND ";
    });
    return client.query(query, args);
};

exports.get = function(project_id) {
    var query = "select * from " + TABLE_NAME + " where project_id = $1 " ;
    return client.query(query, [project_id]);
};

exports.delete = function(id) {
    const query = "delete from " + TABLE_NAME + " where id = "+ id;
    return client.query(query);
};

exports.update = function(id, body) {
    let updates = [];
    for(let field in body){
        if ((body.hasOwnProperty(field) && body[field] && body[field]!== undefined && field !== 'id') || (field === 'nbr_spaces_on_street_parking')){
            updates.push(client.query("update " + TABLE_NAME + " set " + field + " = $1 where id = $2", [body[field], id]));
        }
    }
    return Promise.all(updates);
};
