const client = require('../../../helpers/postgresClient');
const TABLE_CONTRAVENTION = 'contravention';
const TABLE_STATUS = 'list_contravention_status';
const TABLE_PROJECT = "project";
const TABLE_EMPLOYEE = "employee";

exports.create = (body) => {
    let columns = '';
    let values = '';
    const args = [];

    Object.keys(body).forEach((field, index, fields) => {
        columns += field;
        values += `\$${index + 1} `;
        if(index < fields.length - 1) {
            columns += ',';
            values += ',';
        }
        args.push(body[field]);
    });
    const query = `INSERT INTO ${TABLE_CONTRAVENTION} (${columns}) VALUES (${values})`;
    return client.query(query, args);
};

exports.getAll = (params) => {
    let args = [];
    let query = `SELECT contravention.*, 
                        contravention.creation + REPLACE(project.gmt,'UTC','')::interval creation_gmt, 
                        contravention.evolved_into_cn_at+ REPLACE(project.gmt,'UTC','')::interval evolved_into_cn_at_gmt, 
                        contravention.canceled_at+ REPLACE(project.gmt,'UTC','')::interval canceled_at_gmt, 
                        contravention.sent_at+ REPLACE(project.gmt,'UTC','')::interval sent_at_gmt, 
                        CONCAT(employee.firstname, ' ', employee.lastname) as creator_name
                        FROM ${TABLE_CONTRAVENTION} as contravention
                        LEFT JOIN ${TABLE_PROJECT} AS project ON contravention.project_id = project.id
                        LEFT JOIN ${TABLE_EMPLOYEE} employee ON employee.employee_id = contravention.creator_id
                        WHERE (project.deleted_at IS NULL OR contravention.project_id IS NULL)`;

    Object.keys(params).forEach((field, index, fields) => {
        if(index === 0) query += ' AND ';
        switch (field) {
            case 'from':
                query += `creation >= \$${index + 1}`;
                break;
            case 'to':
                query += `creation <= \$${index + 1}`;
                break;
            default:
                query += `${field} = \$${index + 1}`;
        }
        args.push(params[field]);
        if(index < fields.length - 1) query +=  ' AND ';
    });
    return client.query(query, args);
};

exports.getStatusCodes = () => {
    const query = `SELECT * FROM ${TABLE_STATUS}`;
    return client.query(query, []);
};

exports.getOne = (cn_number_offline) => {
    const query = `SELECT cnt.*, 
                cnt.creation + REPLACE(project.gmt,'UTC','')::interval creation_gmt,
                cnt.evolved_into_cn_at+ REPLACE(project.gmt,'UTC','')::interval evolved_into_cn_at_gmt,
                cnt.canceled_at+ REPLACE(project.gmt,'UTC','')::interval canceled_at_gmt,
                cnt.sent_at+ REPLACE(project.gmt,'UTC','')::interval sent_at_gmt,
                cnst.status_name FROM ${TABLE_CONTRAVENTION} cnt, ${TABLE_STATUS} cnst
                LEFT JOIN ${TABLE_PROJECT} AS project ON cnt.project_id = project.id
                WHERE cnt.status = cnst.status_code and cnt.cn_number_offline = $1`;
    return client.query(query, [cn_number_offline]);
};

exports.delete = (cn_number_offline) => {
    const query = `DELETE FROM ${TABLE_CONTRAVENTION} WHERE cn_number_offline = $1`;
    return client.query(query, [cn_number_offline]);
};

exports.update = (params, body) => {
    let query = `update ${TABLE_CONTRAVENTION} set `;
    let args = [];
    delete body.cn_number_offline;
    Object.keys(body).forEach((field, index, fields) => {
        query += ` ${field} = \$${index + 1}, `;
        args.push(body[field]);
    });
    query += ` creation = current_timestamp`;
    const WHEREData = makeWHERE(params, args);
    query += WHEREData.query;
    return client.query(query, WHEREData.args);
};

const makeWHERE = (params, args) => {
    let query = '';
    Object.keys(params).forEach((field, index, fields) => {
        if(index === 0) query += ' WHERE ';
        args.push(params[field]);
        query += `${field} = \$${args.length}`;
        if(index < fields.length - 1) query +=  ' and ';
    });
    return {
        query, args
    };
};
