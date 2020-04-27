const moment = require('moment');
const client = require('../../helpers/postgresClient');
const TABLE_SALE = 'sale';
const TABLE_SALE_PREDICTIVE = 'sale_predictive';

async function getAllByProjectsIds(params) {
    const args = [];
    const projectIds = Array.isArray(params.projectIds)
        ? params.projectIds.join(',') : params.projectIds;
    let tableName = TABLE_SALE;

    if (params.date) {
        const dateMoment = moment(params.date);
        args.push(dateMoment.format('YYYY-MM-DD'));

        if (parseInt(dateMoment.format('DD'), 10) >= parseInt(moment().format('DD'), 10)) {
            tableName = TABLE_SALE_PREDICTIVE;
        }
    }

    let query = `SELECT
                    s.codification_id AS code_id, s.timestamp as date, s.perc_occup as intensity,
                    s.latitude as lat, s.longitude as lng, s.hour, s.weekday
                FROM ${tableName} s WHERE s.codification_id IN (
                        select codification_id
                        from asset_2 asset, asset_model_2 model, asset_type_2 type
                        where asset.project_id IN (${projectIds})
                        and  asset.model_id = model.id
                        and  model.type_id = type.id
                        and type.code = 'Parking Meter'
                ) AND s.timestamp >= $1::date AND s.timestamp < ($1::date + '1 day'::interval)`;

    return client.query(query, args);
}

exports.getAllByProjectsIds = getAllByProjectsIds;