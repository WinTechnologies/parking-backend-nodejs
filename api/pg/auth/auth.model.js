const client = require('../../../helpers/postgresClient');
const TABLE_EMPLOYEE = "employee";
const config = require('../../../config/database');
const bcrypt = require('bcryptjs');
const accessRightsMiddelware = require('../../../middelware/accessRights');

exports.getByUsername = function(body) {
    const username = body.username;
    const query = `SELECT * FROM ${TABLE_EMPLOYEE} WHERE username = $1`;
    return client.query(query, [username]);
};

exports.getById = function(employee_id) {
    if (employee_id) {
        return client.query(`SELECT * FROM ${TABLE_EMPLOYEE} WHERE employee_id = $1`, [employee_id]);
    }
};

exports.getByIdUnfiltred = function(body) {
    const id = body.id;
    const query = `SELECT * FROM ${TABLE_EMPLOYEE} WHERE employee_id = $1`;
    return client.query(query, [id]);
};

exports.update = function(body) {
    const updates = [];
    for(const field in body){
        if(body[field] && field !== 'employee_id' && field !== 'password'){
            if(field === 'address') {
                updates.push(client.query(`UPDATE  ${TABLE_EMPLOYEE} SET address = {street : $1, zip_code : $2, city : $3, state : $4} WHERE employee_id = $5`, [body['address']['street'], body['address']['zip_code'], body['address']['city'], body['address']['state'], body.employee_id]));
            } else {
                updates.push(client.query(`UPDATE  ${TABLE_EMPLOYEE} SET ${field} = $1 WHERE employee_id = $2`, [body[field], body.employee_id]));
            }
        }
        if(!body[field] && (field === 'eod' || field === 'assigned_vehicle' || field === 'except_assigned_vehicle'))
          updates.push(client.query(`UPDATE  ${TABLE_EMPLOYEE} SET ${field} = $1 where employee_id = $2`, [body[field], body.employee_id]));
    }
    return Promise.all(updates);
};

exports.getByRefreshToken = function(refreshToken) {
    if (refreshToken) {
        const query = `SELECT * FROM ${TABLE_EMPLOYEE} WHERE refresh_token = $1`;
        return client.query(query, [refreshToken]);
    } else {
        return new Promise((resolve, reject) => reject())
    }
};

exports.getByUsernameAndRefreshToken = function(username, refreshToken) {
    if (username && refreshToken) {
        const query = `SELECT * FROM ${TABLE_EMPLOYEE} WHERE username = $1 and refresh_token = $2`;
        return client.query(query, [username, refreshToken]);
    } else {
        return new Promise((resolve, reject) => reject())
    }
};

exports.setRefreshToken = function(username, refreshToken) {
    if (username) {
        const query = `UPDATE ${TABLE_EMPLOYEE} SET refresh_token = $1 WHERE username = $2`;
        return client.query(query, [refreshToken, username]);
    } else {
        return new Promise((resolve, reject) => reject())
    }
};

exports.checkPassword = function(body, user) {
    const username = body.username;
    const query = `SELECT * FROM ${TABLE_EMPLOYEE} WHERE username = $1 AND password = $2`;
    const hash = bcrypt.hashSync(body.password, config.secret);
    return client.query(query, [username, hash]);
};

filterUsers = (userId, usersPromise) => {
    return new Promise((resolve, reject) => {
        usersPromise.then(users => {
            if (users && users.rows) {
                accessRightsMiddelware.filterAssets(userId, users.rows, 'site_id').then(results => { // site_id
                    resolve(results);
                }).catch(err => {
                    return reject(err);
                });
            } else {
                resolve([]);
            }
        }).catch(err => {
            return reject(err);
        });
    });
};

exports.resetPassword = function (employee) {
    const query =  `UPDATE  ${TABLE_EMPLOYEE} SET password = $1  WHERE employee_id = $2`;
    const hash = bcrypt.hashSync(employee.password, config.secret);
    return client.query(query, [hash, employee.employee_id]);
};