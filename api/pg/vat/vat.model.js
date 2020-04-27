const client = require('../../../helpers/postgresClient');
const TABLE_VAT = 'vat';
const TABLE_PROJECT = 'project';

exports.create = function(body) {
    var query = `INSERT INTO ${TABLE_VAT} (vat_code, vat_percentage, vat_country, vat_name ) VALUES ($1, $2, $3, $4)`;
    var args = [
        body.vat_code,
        body.vat_percentage,
        body.vat_country,
        body.vat_name
    ];
    return client.query(query, args);
};

exports.getAll = function(values) {
    var query = `SELECT * FROM ${TABLE_VAT}  `;
    var fields = Object.keys(values);
    var args = [];
    var i = 0;

    fields.forEach(x => {
        if(i === 0) query += 'WHERE ';
        query += x + ' = $' + (i + 1);
        args.push(values[x]);
        i++;
        if(i < fields.length) query += ' AND ';
    });
    return client.query(query, args);
};

exports.getOneByProject = (project_id) => {
    const query =  `SELECT vat.*
                    FROM ${TABLE_VAT}, ${TABLE_PROJECT}
                    WHERE vat.id = project.vat_id AND project.id = $1`;
    return client.query(query, [project_id]);
};

exports.delete = function(id) {
    const query = `DELETE FROM ${TABLE_VAT} WHERE segment_id = $1`;
    return client.query(query, [id]);
};

exports.update = function(id, body) {
    let updates = [];
    for(let field in body){
        if(body.hasOwnProperty(field) && body[field] && field !== 'id'){
            updates.push(client.query(`UPDATE ${TABLE_VAT} SET ${field} = $1 WHERE id = $2`, [body[field], id]));
        }
    }
    return Promise.all(updates);
};