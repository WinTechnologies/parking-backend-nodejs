const postgresClient = require('../../helpers/postgresClient');
const mawgifController = require('../mawgif/controller');
const { CNStatus, CNNote } = require('./constants');
const { nonInsertCNColumns } = require('./middleware');
const COMMON_FUNC = require('../services/util/common');

const TABLE_CONTRAVENTION = 'contravention';
const TABLE_VIOLATION = 'violation';
const TABLE_VEHICLE_COLOR = 'vehicle_color';
const TABLE_GROUP_VIOLATION = 'group_violation';
const TABLE_STATUS = 'list_contravention_status';
const TABLE_PROJECT = 'project';
const TABLE_EMPLOYEE = 'employee';

exports.createCN = (body) => {
    let columns = '';
    let values = '';
    const args = [];

    let index = 1;
    Object.keys(body).forEach((key, i, keys) => {
        if (!nonInsertCNColumns.includes(key)) {
            if (index !== 1) {
                columns += ',';
                values += ',';
            }
            columns += key;
            values += `\$${index} `;
            index += 1;
            args.push(body[key]);
        }
    });

    const query = `INSERT INTO ${TABLE_CONTRAVENTION} (${columns}) VALUES (${values}) RETURNING *`;
    return postgresClient.queryWithLog(query, args);
};

exports.getContraventions = (values) => {
    var queryStr = `SELECT * FROM ${TABLE_CONTRAVENTION}`;
    var queryArgs = [];
    var num_args = Object.keys(values).length;
    var empty = true;
    for (var key in values) {
        if (values.hasOwnProperty(key)) empty = false;
    }
    if (!empty) {
        queryStr += ' WHERE ';
        var i = 1;
        for (var property in values) {
            if (values.hasOwnProperty(property)) {
                queryStr += property + ' = $' + i++;
                num_args -= 1;
                num_args > 0 ? (queryStr += ' AND ') : null;
                queryArgs.push(values[property]);
            }
        }
    }
    return postgresClient.query(queryStr, queryArgs);
};

exports.getByProjectPg = (project_id) => {
    const query = `SELECT * FROM ${TABLE_CONTRAVENTION} WHERE project_id= $1`;
    return postgresClient.query(query, [project_id]);
};

exports.getByIdPg = (id) => {
    if (id) {
        return postgresClient.query(
            `SELECT * FROM ${TABLE_CONTRAVENTION} WHERE cn_number_offline = $1 ::text`,
            [id]
        );
    }
};

exports.getObservationIDPg = (values) => {
    const car_plate = values.car_plate;
    if (car_plate) {
        return postgresClient.query(
            `SELECT * FROM ${TABLE_CONTRAVENTION} WHERE car_plate = $1 and status = $2`,
            [car_plate, CNStatus.Obs]
        );
    }
};

exports.observationsHistoryPg = (body) => {
    const creator_id = body.creator_id;
    const query = `SELECT * FROM  ${TABLE_CONTRAVENTION} WHERE creator_id = $1 and status = $2`;
    return postgresClient.query(query, [creator_id, CNStatus.Obs]);
};

exports.getContraventionsByCreatorAndStatus = (body) => {
    const creator_id = body.creator_id;
    const query = `SELECT * FROM ${TABLE_CONTRAVENTION} WHERE creator_id = $1 and status = $2`;
    return postgresClient.query(query, [creator_id, CNStatus.CN]);
};

exports.getContraventionsByUser = (body) => {
    const creator_id = body.creator_id;
    const query = `SELECT * FROM ${TABLE_CONTRAVENTION} WHERE creator_id = $1`;
    return postgresClient.query(query, [creator_id]);
};

exports.transformObservation = (transformParams) => {
    const {
        cn_number_offline,
        evolved_into_cn_at,
        violation_picture,
        employee_id,
    } = transformParams;
    const creation = cn_number_offline.substring(0,12);
    const YY = parseInt(creation.substring(0,2));
    const MM = parseInt(creation.substring(2,4));
    const DD = parseInt(creation.substring(4,6));
    const hh = parseInt(creation.substring(6,8));
    const mn = parseInt(creation.substring(8,10));
    const ss = parseInt(creation.substring(10,12));

    // TODO: validate date
    const creationTime = new Date(`20${YY}-${MM}-${DD} ${hh}:${mn}:${ss}`);
    const evolvedIntoCnAt = new Date(evolved_into_cn_at);

    let observation_time = COMMON_FUNC.getMinutesBetweenDates(creationTime, evolvedIntoCnAt);

    const query = `UPDATE ${TABLE_CONTRAVENTION}
                    SET violation_picture = $1,
                        status = $2,
                        evolved_into_cn_at = $3,
                        observation_time = $4,
                        updated_at = NOW(),
                        updated_by = $5,
                        notes = $6
                    WHERE
                        cn_number_offline = $7 RETURNING *`;

    return postgresClient.query(query, [
        violation_picture,
        CNStatus.CN,
        evolved_into_cn_at,
        observation_time,
        employee_id,
        CNNote.EvolvedCN,
        cn_number_offline,
    ]);
};

exports.cancelObservationPg = (cn_number_offline, canceled_by) => {
    const query_pg = `UPDATE ${TABLE_CONTRAVENTION} SET status = $2, canceled_at = now(), canceled_by = $3, updated_at = NOW(), updated_by = $4 WHERE cn_number_offline = $1 RETURNING *`;
    return postgresClient.query(query_pg, [cn_number_offline, CNStatus.CancelObs, canceled_by, canceled_by]);
};

/**
 * Get observations that are created more than 24 hours ago
 * @param limit: Limit of count
 * @returns {Promise<void>}
 */
exports.getExpiredObs = (limit) => {
    let query = `SELECT * FROM ${TABLE_CONTRAVENTION}
        WHERE status = '${CNStatus.Obs}'                /* Only observations */
            AND creation < NOW() - INTERVAL '24 HOURS'  /* Observations that are created more than 24 hours ago */
        ORDER BY creation DESC
        `;

    if (limit) {
        query = `${query} LIMIT ${limit};`;
    } else {
        query = `${query};`;
    }

    return postgresClient.query(query);
};


exports.updatePg = (body) => {
    var queryStr = `UPDATE ${TABLE_CONTRAVENTION} SET `;
    var queryArgs = [];
    var num_args = Object.keys(body).length;
    var empty = true;
    for (var key in body) {
        if (body.hasOwnProperty(key)) empty = false;
    }
    var i = 1;
    for (var property in body) {
        if (body.hasOwnProperty(property)) {
            if (property !== 'cn_number_offline'){
                queryStr += property + ' = $' + i++;
                num_args -= 1;
                num_args > 1 ? (queryStr += ' , ') : null;
                queryArgs.push(body[property]);
            }
        }
    }
    if (!empty) {
        queryStr += ' WHERE cn_number_offline = $' + i;
        queryArgs.push(body['cn_number_offline'])
    }
    return postgresClient.query(queryStr, queryArgs);
};

exports.getContraventionByPlatePg = (values) => {
    var plate = values.car_plate;
    var query = `SELECT * FROM ${TABLE_CONTRAVENTION} WHERE car_plate = $1`;

    return postgresClient.query(query, [plate]);
};

exports.getObservationsByCreatorID = (params) => {
    /*
    var sql = `SELECT DISTINCT  contravention.*, violation.is_nonpayment
                    FROM contravention, violation, group_violation
                    WHERE
                    contravention.status = '0' AND contravention.creator_id = $1
                    AND (contravention.violation_id = violation.id)
                    OR (contravention.assignment_id = group_violation.id AND group_violation.violation_id = violation.id)`;
  */
    const projectId = params.project_id;
    const creatorId = params.creator_id;

    var sql = `SELECT contravention.*, violation.is_nonpayment
                FROM ${TABLE_CONTRAVENTION} contravention
                    LEFT JOIN ${TABLE_VIOLATION} violation ON contravention.violation_id = violation.id
                    -- LEFT OUTER JOIN ${TABLE_GROUP_VIOLATION} group_violation ON contravention.assignment_id = group_violation.id
                WHERE
                    contravention.project_id = $1 -- Get by project_Id
                    AND contravention.status = '0' -- 0 for observation (make this one as constant)
                    AND contravention.creator_id = $2  -- Get by EmplopyeeID
                    AND contravention.creation >= NOW() - INTERVAL '24 HOURS' -- Get Observations of the last 24 hours only;`;
    return postgresClient.query(sql, [projectId, creatorId]);
};

exports.getContraventionByCnNumberOffline = (cnNumberOffline) => {
    const query = `SELECT cnt.*,
              cnt.creation + REPLACE(project.gmt,'UTC','')::interval creation_gmt,
              cnt.evolved_into_cn_at+ REPLACE(project.gmt,'UTC','')::interval evolved_into_cn_at_gmt,
              cnt.canceled_at+ REPLACE(project.gmt,'UTC','')::interval canceled_at_gmt,
              cnt.sent_at+ REPLACE(project.gmt,'UTC','')::interval sent_at_gmt,
              cnst.status_name FROM ${TABLE_CONTRAVENTION} cnt, ${TABLE_STATUS} cnst
              LEFT JOIN ${TABLE_PROJECT} AS project ON cnt.project_id = project.id
              WHERE cnt.status = cnst.status_code and cnt.cn_number_offline = $1`;
    return postgresClient.query(query, [cnNumberOffline]);
};

exports.updateContravention = (whereParams, updateBody, currentUser) => {
    let query = `UPDATE ${TABLE_CONTRAVENTION} SET `;
    let queryArgs = [];
    let pIndex = 0;

    Object.keys(updateBody).forEach((key, i) => {
        pIndex = i + 1;
        query = `${query} ${key} = \$${pIndex}, `;
        queryArgs.push(updateBody[key]);
    });

    pIndex = pIndex + 1;
    query = `${query} updated_at = NOW(), updated_by = \$${pIndex} `;
    queryArgs.push(currentUser);

    Object.keys(whereParams).forEach((key, i, fields) => {
        if (i === 0) {
            query += ' WHERE ';
        }

        query = `${query} ${key} = \$${pIndex + i + 1} `;
        queryArgs.push(whereParams[key]);

        if (i < fields.length - 1) {
            query = `${query} AND `;
        }
    });

    query = `${query} RETURNING *`;
    return postgresClient.query(query, queryArgs);
};

exports.getAll = (params) => {
    let args = [];
    let query = `SELECT contravention.*,
        CONCAT(employee.firstname, ' ', employee.lastname) as creator_name,
        contravention.status as category,
        project.currency_code as currency_code,
        CASE
            WHEN contravention.evolved_into_cn_at IS NULL THEN contravention.creation
            ELSE contravention.evolved_into_cn_at
        END AS contravention_created_at,
        project.project_code project_code,
        project.gmt gmt
        FROM ${TABLE_CONTRAVENTION} as contravention
        LEFT JOIN ${TABLE_PROJECT} AS project ON contravention.project_id = project.id
        LEFT JOIN ${TABLE_EMPLOYEE} employee ON employee.employee_id = contravention.creator_id
        WHERE (project.deleted_at IS NULL OR contravention.project_id IS NULL)`;

    Object.keys(params).forEach((field, index, fields) => {
        if (index === 0) {
            query += ' AND ';
        }

        if( params[field] !== '' ) {
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

            if (index < fields.length - 1) {
                query += ' AND ';
            }
        }
    });

    return postgresClient.query(query, args);
};

exports.getStatusCodes = () => {
    const query = `SELECT * FROM ${TABLE_STATUS}`;
    return postgresClient.query(query, []);
};
