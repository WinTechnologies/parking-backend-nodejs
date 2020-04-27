const client = require('../../../helpers/postgresClient');
const TABLE_JOB = 'job';
const TABLE_CARPARK = 'carpark';
const TABLE_ASSET = 'asset_2';
const TABLE_PROJECT = 'project';
const TABLE_EMPLOYEE = 'employee';

exports.getAll = (params) => {
    let args = [];
    let query = `SELECT job.*,
                        job.creation + REPLACE(project.gmt,'UTC','')::interval creation_gmt,
                        job.date_end + REPLACE(project.gmt,'UTC','')::interval date_end_gmt,
                        job.date_start + REPLACE(project.gmt,'UTC','')::interval date_start_gmt,
                        job.sent_at+ REPLACE(project.gmt,'UTC','')::interval sent_at_gmt,
                        carpark.carpark_name,
                        asset.vehicle_plate,
                        CONCAT(employee.firstname, ' ', employee.lastname) as creator_name
                    FROM ${TABLE_JOB} job `;

    query += ` LEFT JOIN ${TABLE_CARPARK} carpark ON job.car_pound_id = carpark.id ` +
      ` LEFT JOIN ${TABLE_ASSET} asset on job.vehicle_codification = asset.codification_id` +
      ` LEFT JOIN ${TABLE_PROJECT} AS project ON job.project_id = project.id` +
      ` LEFT JOIN ${TABLE_EMPLOYEE} AS employee ON employee.employee_id = job.creator_id` +
      ` WHERE (project.deleted_at IS NULL OR job.project_id IS NULL)`;

    Object.keys(params).forEach((field, index, fields) => {
        if(index === 0) query += ' AND ';
        switch (field) {
            case 'from':
                query += `job.creation >= \$${index + 1}`;
                break;
            case 'to':
                query += `job.creation <= \$${index + 1}`;
                break;
            default:
                query += `job.${field} = \$${index + 1}`;
        }
        args.push(params[field]);
        if(index < fields.length - 1) query +=  ' AND ';
    });
    return client.query(query, args);
};

exports.getOne = (job_number) => {
    let query = `SELECT job.*,
     job.creation + REPLACE(project.gmt,'UTC','')::interval creation_gmt,
     job.date_end + REPLACE(project.gmt,'UTC','')::interval date_end_gmt,
     job.date_start + REPLACE(project.gmt,'UTC','')::interval date_start_gmt,
     job.sent_at+ REPLACE(project.gmt,'UTC','')::interval sent_at_gmt FROM ${TABLE_JOB} job`;
    query += ` LEFT JOIN ${TABLE_CARPARK} carpark ON job.car_pound_id = carpark.id ` +
        ` LEFT JOIN ${TABLE_PROJECT} AS project ON job.project_id = project.id` +
      ` LEFT JOIN ${TABLE_ASSET} asset on job.vehicle_codification = asset.codification_id`;
    query += `WHERE job.job_number = $1`;
    return client.query(query, [job_number]);
};

exports.getOneByCarPlate = (car_plate, job_type) => {

  const query = `SELECT job.*,
     job.creation + REPLACE(project.gmt,'UTC','')::interval creation_gmt,
     job.date_end + REPLACE(project.gmt,'UTC','')::interval date_end_gmt,
     job.date_start + REPLACE(project.gmt,'UTC','')::interval date_start_gmt,
     job.sent_at+ REPLACE(project.gmt,'UTC','')::interval sent_at_gmt FROM ${TABLE_JOB}
     LEFT JOIN ${TABLE_PROJECT} AS project ON job.project_id = project.id
     WHERE car_plate = $1 and status = $2`;
  return client.query(query, [car_plate, job_type]);
};

exports.delete = (job_number) => {
    const query = `DELETE FROM ${TABLE_JOB} WHERE job_number = $1`;
    return client.query(query, [job_number]);
};

exports.update = (params, body) => {
    let query = `UPDATE ${TABLE_JOB} SET `;
    let args = [];
    delete body.job_number;
    Object.keys(body).forEach((field, index, fields) => {
        query += ` ${field} = \$${index + 1} `;
        if(index < fields.length - 1) {
            query += ', ';
        }
        args.push(body[field]);
    });
    const whereData = makeWhere(params, args);
    query += whereData.query;
    return client.query(query, whereData.args);
};

const makeWhere = (params, args) => {
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

exports.onSpotDeClamp = (job_number, job_status) => {

    const query = `UPDATE ${TABLE_JOB} SET is_paid = true, status = $2 WHERE job_number = $1 RETURNING *`;
    return client.query(query, [job_number, job_status]);
};
