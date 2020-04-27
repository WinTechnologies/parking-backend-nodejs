const client = require('../helpers/cassandraClient');
const CASSANDRA_NULL_VALUE = require('../config/database').CASSANDRA_NULL_VALUE;

exports.getRightsBySiteAndUsers = function(sites, users) {
    users = users || [];
    sites = sites || [];
    let resultes = [];
    sites.forEach(function(site) {
        users.forEach(function(user) {
            resultes.push(client.execute("select * from access_rights where site_id = ? AND user_id = ?", [site, user]));
        });
    });
    return Promise.all(resultes);
};

exports.getRightsBySiteIdAndUserId = function(site, user) {
    return client.execute("select * from access_rights where site_id = ? AND user_id = ?", [site, user])
};

exports.getSitesByUserId = function(user) {
    return client.execute("select site_id, rights from access_rights where user_id = ?", [user])
};

exports.getProjectsByUserId = function(user) {
    return client.execute("select project_id, rights from access_rights where user_id = ?", [user])
};

exports.updateRightsBySiteAndUsers = function(sites, users, rights) {
    users = users || [];
    sites = sites || [];
    rights = rights.join(',') || "";
    let resultes = [];
    sites.forEach(function(site) {
        if (site && site.project_id) {
            site.project_id = site.project_id;
        }
        users.forEach(function(user) {
            resultes.push(
                client.execute("update access_rights set rights = ?, project_id = ? where site_id = ? AND user_id = ?", [rights, site.project_id, site.id, user])
            );
        });
    });
    return Promise.all(resultes);
};
