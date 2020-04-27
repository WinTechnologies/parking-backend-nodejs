var client = require('../helpers/cassandraClient');

exports.create = function(values) {
    var queryStr = "insert into team(id, typeteam, members, project_id, site_id, zone_id) values(uuid(), [''], ?, ?, ?, ?)";
    return client.execute(queryStr, [values.typeteam, values.project_id, values.site_id, values.zone_id]);

};

exports.get = function(values) {
    if(values.id) {
        var query = "select * from team where id = ?";
        return client.execute(query, [values.id]);
    } else if(values.typeteam) {
        var query = "select * from team where typeteam = ? ALLOW FILTERING";
        return client.execute(query, [values.typeteam]);
    } else if(values.zone_id) {
        var query = "select * from team where zone_id = ? ALLOW FILTERING";
        return client.execute(query, [values.zone_id]);
    } else if(values.site_id) {
        var query = "select * from team where site_id = ? ALLOW FILTERING";
        return client.execute(query, [values.site_id]);
    } else {
        var query = "select * from team";
        return client.execute(query);
    }
};

exports.update = function(body) {
    var updates = [];
    for(var field in body){
        if(body[field] && field != 'id'){
            updates.push(client.execute("update team set "+field+" = ? where id = ?", [body[field], body.id]));
        }
    }
    return Promise.all(updates);
};

exports.delete = function(id) {
    var query = "delete from team where id = ?";
    return client.execute(query, [id]);
}