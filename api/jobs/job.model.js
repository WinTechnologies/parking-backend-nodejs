const moment = require('moment');
const postgresClient = require('../../helpers/postgresClient');

const TABLE_JOB = 'job';
const TABLE_PROJECT = 'project';
const TABLE_CARPARK = 'carpark';
const TABLE_ASSET = 'asset_2';
const TABLE_EMPLOYEE = 'employee';
const TABLE_LIST_JOB_CANCELLATION_REASON = 'list_job_cancellation_reason';

exports.createJob = (values) => {
    const queryStr =
        `INSERT INTO ${TABLE_JOB} (
            job_type,
            creation,
            cn_number, cn_number_offline,
            car_plate, car_plate_ar,
            car_brand, car_model,
            car_color, car_color_ar,
            plate_country,
            plate_type, plate_type_ar,
            creator_id, creator_username,
            latitude, longitude,
            reference,
            project_name, project_id,
            violation, violation_id, violation_code, violation_pictures,
            amount,
            zone_id, zone_name, city_cd,
            intersection_cd, intersection_name_en, intersection_name_ar,
            street_cd, street_name_en, street_name_ar,
            address_simplified,
            status, sent_by,
            canceled_code, canceled_by
            )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
            $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,
            $32,$33,$34,$35,$36,$37,$38,$39) RETURNING *`;

    const args = [
        values.job_type ? values.job_type : null,
        values.creation ? values.creation : null,

        values.cn_number ? values.cn_number : null,
        values.cn_number_offline ? values.cn_number_offline : null,

        values.car_plate ? values.car_plate : 'NO_DATA',
        values.car_plate_ar ? values.car_plate_ar : 'NO_DATA',

        values.car_brand ? values.car_brand : 'NO_DATA',
        values.car_model ? values.car_model : 'NO_DATA',

        values.car_color ? values.car_color : 'NO_DATA',
        values.car_color_ar ? values.car_color_ar : 'NO_DATA',

        values.plate_country ? values.plate_country : 'NO_DATA',

        values.plate_type ? values.plate_type : 'NO_DATA',
        values.plate_type_ar ? values.plate_type_ar : 'NO_DATA',

        values.creator_id ? values.creator_id : null,
        values.creator_username ? values.creator_username : null,

        values.latitude ? Number(values.latitude) : null,
        values.longitude ? Number(values.longitude) : null,

        values.reference ? values.reference : null,

        values.project_name ? values.project_name : null,
        values.project_id ? values.project_id : null,

        values.violation ? values.violation : null,
        values.violation_id ? String(values.violation_id) : null,
        values.violation_code,
        values.violation_pictures ? values.violation_pictures : null,

        values.amount ? values.amount : null,

        values.zone_id ? values.zone_id : null,
        values.zone_name ? values.zone_name : null,
        values.city_cd ? values.city_cd : null,

        values.intersection_cd ? values.intersection_cd : null,
        values.intersection_name_en ? values.intersection_name_en : null,
        values.intersection_name_ar ? values.intersection_name_ar : null,

        values.street_cd ? values.street_cd : null,
        values.street_name_en ? values.street_name_en : null,
        values.street_name_ar ? values.street_name_ar : null,

        values.address_simplified ? values.address_simplified : null,

        values.status ? values.status : null,
        values.sent_by,

        values.canceled_code ? values.canceled_code : null,
        values.canceled_by ? values.canceled_by : null
    ];

    return postgresClient.query(queryStr, args);
};

exports.getJobsPg = (values = {}) => {
    const project_id = values.project_id;
    const job_type = values.job_type;

    var args = [];
    let query;
    if( project_id && job_type ) {
        delete values.project_id;
        delete values.job_type;

        query = `SELECT job.*,
                job.status category,
                project.gmt as gmt,
                project.currency_code as currency_code,
                list_job_cancellation_reason.name_en AS cancellation_reason_name_en,
                list_job_cancellation_reason.name_ar AS cancellation_reason_name_ar,
                list_job_cancellation_reason.job_action_code AS cancellation_reason_job_action_code
                FROM ${TABLE_JOB} as job
            LEFT JOIN ${TABLE_PROJECT} AS project ON job.project_id = project.id
            LEFT JOIN ${TABLE_LIST_JOB_CANCELLATION_REASON} AS list_job_cancellation_reason ON job.canceled_code = list_job_cancellation_reason.code
            WHERE job.project_id = $1  -- Get JOBs by project_id
                AND job.job_type = $2 -- Get JOBs by type
                AND job.creation >= NOW() - INTERVAL '24 HOURS' -- Get JOBs of the last 24 hours only
                AND job.status IN (-- Get JOBs that are not taken
                  ---## 'CLAMP TO TOW' . if job_status = CLAMP TO TOW
                  -- 'TOW IN ROUTE',    -- start job is already taken
                  -- 'TOWED',   -- complete job is finished
                  -- 'CANCELED',   -- cancel job is canceled due to Driver's condition, someone else must take it
                  'ACTIVE',    -- active
                  -- 'RELEASED',  -- paid car is released
                  -- 'MISSED',   -- missed is missed when driver arrived at the place and the car left already
                  ---## 'TOW JOB' if job_status = TOW JOB
                  -- 'TOW IN ROUTE',    -- start job is already taken
                  -- 'TOWED',   -- complete job is finished
                  -- 'CANCELED',   -- cancel
                  'TOW REQUESTED',     -- open
                  -- 'IN ROUTE TO CARPOUND',    -- delivery job is already taken
                  -- 'RELEASED',  -- paid car is released
                  -- 'MISSED',    -- missed is missed when driver arrived at the place and the car left already
                  ---## 'DECLAMP JOB' if job_status = DECLAMP JOB
                  -- 'DECLAMP IN ROUTE',  -- start job is already taken
                  -- 'RELEASED',  -- complete
                  -- 'CANCELED',   -- cancel job is canceled due to Driver's condition, someone else must take it
                  'DECLAMP REQUESTED',   -- open
                  -- 'RELEASED',  -- paid car is released
                  -- 'MISSED',    -- missed is missed when driver arrived at the place and the car left already
                  ---## 'CLAMP JOB'  if job_status = CLAMP JOB
                  -- 'CLAMP IN ROUTE',   -- start job is already taken
                  -- 'CLAMPED',    -- complete job is finished
                  -- 'CANCELED',   -- cancel job is canceled due to Driver's condition, someone else must take it
                  'CLAMP REQUESTED',    -- open
                  'ACTIVE'    -- active
                 -- 'MISSED'     -- missed job is missed when driver arrived at the place and the car left already
                ) ORDER BY job.creation DESC`;
        args.push(project_id);
        args.push(job_type);
    } else {
        query = `SELECT job.*,
                        carpark.carpark_name,
                        asset.vehicle_plate,
                        job.status category,
                        CONCAT(employee.firstname, ' ', employee.lastname) as creator_name,
                        project.gmt as gmt,
                        project.currency_code as currency_code,
                        list_job_cancellation_reason.name_en AS cancellation_reason_name_en,
                        list_job_cancellation_reason.name_ar AS cancellation_reason_name_ar,
                        list_job_cancellation_reason.job_action_code AS cancellation_reason_job_action_code
                FROM ${TABLE_JOB} job
                LEFT JOIN ${TABLE_CARPARK} carpark ON job.car_pound_id = carpark.id
                LEFT JOIN ${TABLE_ASSET} asset on job.vehicle_codification = asset.codification_id
                LEFT JOIN ${TABLE_PROJECT} AS project ON job.project_id = project.id
                LEFT JOIN ${TABLE_EMPLOYEE} AS employee ON employee.employee_id = job.creator_id
                LEFT JOIN ${TABLE_LIST_JOB_CANCELLATION_REASON} AS list_job_cancellation_reason ON job.canceled_code = list_job_cancellation_reason.code
                WHERE (project.deleted_at IS NULL OR job.project_id IS NULL)`;

        Object.keys(values).forEach((field, index, fields) => {
            if (index === 0) {
                query += ' AND ';
            }

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
            args.push(values[field]);
            if(index < fields.length - 1) {
              query +=  ' AND ';
            }
        });
    }
    return postgresClient.query(query,args);
};

exports.checkIfAJobIsAvailable = (data) => {
  var query = `SELECT job.*,
      job.creation + REPLACE(project.gmt,'UTC','')::interval creation_gmt,
      job.date_end + REPLACE(project.gmt,'UTC','')::interval date_end_gmt,
      job.date_start + REPLACE(project.gmt,'UTC','')::interval date_start_gmt,
      job.sent_at+ REPLACE(project.gmt,'UTC','')::interval sent_at_gmt
      FROM ${TABLE_JOB} as job
      LEFT JOIN ${TABLE_PROJECT} AS project ON job.project_id = project.id
      WHERE car_plate=$1 AND (status = 'TOW IN ROUTE' OR status = 'CLAMP IN ROUTE')`;
  return postgresClient.query(query,[data.car_plate]);
};

function compareByISODates(a, b) {
  if (moment(a.creation).isBefore(b.creation)) return 1;
  if (moment(a.creation).isAfter(b.creation)) return -1;
  return 0;
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
    Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

exports.getByProjectPg = (project_id) => {
  const query = `SELECT job.*,
      job.creation + REPLACE(project.gmt,'UTC','')::interval creation_gmt,
      job.date_end + REPLACE(project.gmt,'UTC','')::interval date_end_gmt,
      job.date_start + REPLACE(project.gmt,'UTC','')::interval date_start_gmt,
      job.sent_at+ REPLACE(project.gmt,'UTC','')::interval sent_at_gmt
      FROM ${TABLE_JOB} as job
      LEFT JOIN ${TABLE_PROJECT} AS project ON job.project_id = project.id
      WHERE project_id = $1`;
  return postgresClient.query(query,[project_id]);
};

function contain(array, field, data) {
  let res = false;
  if (Array.isArray(array) && array[0] && array[0][field]) {
    array.forEach(row => {
      if (row[field] === data) res = true;
    });
  }
  return res;
}

function getAxis() {
  return {
    rows: [
      {
        name: 'price_transaction',
        label: 'Price',
        type: 'Number',
        x_enabled: true,
        y_enabled: true
      },
      {
        name: 'nb_contraventions',
        label: 'Number of contraventions',
        type: 'Number',
        x_enabled: false,
        y_enabled: true
      },
      {
        name: 'date_transaction',
        label: 'Date',
        type: 'Date',
        x_enabled: true,
        y_enabled: false
      },
      {
        name: 'name_employe',
        label: 'Employee',
        type: 'String',
        x_enabled: true,
        y_enabled: false
      },
      {
        name: 'nb_jobs',
        label: 'Number of jobs',
        type: 'Number',
        x_enabled: false,
        y_enabled: true
      },
      {
        name: 'price_job',
        label: 'Job amount',
        type: 'Number',
        x_enabled: false,
        y_enabled: true
      }
    ]
  };
}

exports.getByIdPg = (id) => {
  if (id) {
    return postgresClient.query(`SELECT job.*,
      job.creation + REPLACE(project.gmt,'UTC','')::interval creation_gmt,
      job.date_end + REPLACE(project.gmt,'UTC','')::interval date_end_gmt,
      job.date_start + REPLACE(project.gmt,'UTC','')::interval date_start_gmt,
      job.sent_at+ REPLACE(project.gmt,'UTC','')::interval sent_at
      FROM ${TABLE_JOB} as job
      LEFT JOIN ${TABLE_PROJECT} AS project ON job.project_id = project.id WHERE job_number = $1`, [id]);
  }
};

exports.getByTakerPg = (query) => {
    const taker_id = query.taker_id;
    const taker_username = query.taker_username;
    if (taker_id || taker_username) {
        return postgresClient.query(
            `SELECT job.*,
                job.creation + REPLACE(project.gmt,'UTC','')::interval creation_gmt,
                job.date_end + REPLACE(project.gmt,'UTC','')::interval date_end_gmt,
                job.date_start + REPLACE(project.gmt,'UTC','')::interval date_start_gmt,
                job.sent_at+ REPLACE(project.gmt,'UTC','')::interval sent_at_gmt
                FROM ${TABLE_JOB} as job
                LEFT JOIN ${TABLE_PROJECT} AS project
                    ON job.project_id = project.id
                WHERE taker_id = $1 OR taker_username = $2`,
            [taker_id, taker_username]);
  }
};

exports.getJobsByReferencePg = (reference) => {
  if (reference) {
    return postgresClient.query(`SELECT job.*,
      job.creation + REPLACE(project.gmt,'UTC','')::interval creation_gmt,
      job.date_end + REPLACE(project.gmt,'UTC','')::interval date_end_gmt,
      job.date_start + REPLACE(project.gmt,'UTC','')::interval date_start_gmt,
      job.sent_at+ REPLACE(project.gmt,'UTC','')::interval sent_at_gmt
      FROM ${TABLE_JOB} as job
      LEFT JOIN ${TABLE_PROJECT} AS project ON job.project_id = project.id WHERE reference = $1`, [reference]);
  }
};

exports.updateByJobNumber = (updateBody, currentUser) => {
    let query = `UPDATE ${TABLE_JOB} SET `;
    const queryArgs = [];

    const jobNumber = updateBody['job_number'];

    let empty = true;
    for (let key in updateBody) {
        if (updateBody.hasOwnProperty(key)) empty = false;
    }

    let i = 1;
    let numArgs = Object.keys(updateBody).length;
    for (let property in updateBody) {
        if (updateBody.hasOwnProperty(property)) {
            query = `${query} ${property} = $${i++}`;
            if (--numArgs > 0) {
                query = `${query} , `;
            }
            queryArgs.push(updateBody[property]);
        }
    }

    // query = `${query}, updated_at = NOW(), updated_by = \$${i++} `;
    // queryArgs.push(currentUser);

    if (!empty) {
        query = `${query} WHERE job_number = $${i} RETURNING *`;
        queryArgs.push(jobNumber);
    }
    return postgresClient.query(query, queryArgs);
};

/*
exports.historyPgByTakerID = function (body) {
  const query = `SELECT job.*,
      job.creation + REPLACE(project.gmt,'UTC','')::interval creation_gmt,
      job.date_end + REPLACE(project.gmt,'UTC','')::interval date_end_gmt,
      job.date_start + REPLACE(project.gmt,'UTC','')::interval date_start_gmt,
      job.sent_at+ REPLACE(project.gmt,'UTC','')::interval sent_at_gmt
      FROM ${TABLE_JOB} as job
      LEFT JOIN ${TABLE_PROJECT} AS project ON job.project_id = project.id WHERE taker_username = $1`;
  return postgresClient.query(query, [body.taker_username]);
};

exports.setJobStatusPg = function (body) {
  if (body && body.job_number && body.status) {
    return postgresClient.query(`UPDATE ${TABLE_JOB} SET status = $1 WHERE job_number = $2`, [
      body.status,
      body.job_number
    ]);
  }
};

exports.setTowVehicleIDPg = function (body) {
  return postgresClient.query(`UPDATE ${TABLE_JOB} SET vehicle_codification = $1 WHERE job_number = $2`, [
    body.vehicle_codification,
    body.job_number
  ]);
};
*/

exports.getPicturesPg = (body) => {
  const idJob = body.job_number;
  return postgresClient.query(`SELECT violation_pictures FROM ${TABLE_JOB} WHERE job_number = $1`, [idJob]);
};

exports.addClampPicturesPg = (params) => {
  const idJob = params.id;
  const pic1 = params.pic1;
  const pic2 = params.pic2;
  var request =
    `UPDATE ${TABLE_JOB} SET clamp_pictures = $1 WHERE job_number = $2`;

    return postgresClient.query(request, [[pic1,pic2],idJob]);
};

/*
exports.getObsPg = username => {
  return postgresClient.query(
    `SELECT * FROM ${TABLE_CONSTRAVENTION} WHERE status = $1 AND creator_username = $2`,
    ['0', username]
  );
};
*/

exports.getByEmployeeIdPg = (employee_id) => {
  if (employee_id) {
    return postgresClient.query(`SELECT * FROM ${TABLE_JOB} WHERE creator_id = $1`, [employee_id]);
  }
};

exports.getJobByNumberPg = (job_number) => {
  let query = `SELECT job.*,
                job.creation + REPLACE(project.gmt,'UTC','')::interval creation_gmt,
                job.date_end + REPLACE(project.gmt,'UTC','')::interval date_end_gmt,
                job.date_start + REPLACE(project.gmt,'UTC','')::interval date_start_gmt,
                job.sent_at+ REPLACE(project.gmt,'UTC','')::interval sent_at_gmt FROM ${TABLE_JOB} job`;
  query +=  ` LEFT JOIN ${TABLE_CARPARK} carpark ON job.car_pound_id = carpark.id ` +
            ` LEFT JOIN ${TABLE_PROJECT} AS project ON job.project_id = project.id` +
            ` LEFT JOIN ${TABLE_ASSET} asset on job.vehicle_codification = asset.codification_id`;
  query +=  `WHERE job.job_number = $1`;
  return postgresClient.query(query, [job_number]);
};

exports.getJobByCarPlatePg = (car_plate, job_type) => {
  const query = `SELECT job.*,
                  job.creation + REPLACE(project.gmt,'UTC','')::interval creation_gmt,
                  job.date_end + REPLACE(project.gmt,'UTC','')::interval date_end_gmt,
                  job.date_start + REPLACE(project.gmt,'UTC','')::interval date_start_gmt,
                  job.sent_at+ REPLACE(project.gmt,'UTC','')::interval sent_at_gmt FROM ${TABLE_JOB}
              LEFT JOIN ${TABLE_PROJECT} AS project ON job.project_id = project.id
     WHERE car_plate = $1 and status = $2`;

  return postgresClient.query(query, [car_plate, job_type]);
};

/*
exports.updateJobSpotDeClampPg = (job_number, job_status) => {
  const query = `UPDATE ${TABLE_JOB} SET is_paid = true, status = $1 WHERE job_number = $2 RETURNING *`;
  return postgresClient.query(query, [job_status, job_number]);
};
*/

exports.getJobByCnNumberOffline = (cn_number_offline) => {
  let query = `SELECT job.*,
                job.creation + REPLACE(project.gmt,'UTC','')::interval creation_gmt,
                job.date_end + REPLACE(project.gmt,'UTC','')::interval date_end_gmt,
                job.date_start + REPLACE(project.gmt,'UTC','')::interval date_start_gmt,
                job.sent_at+ REPLACE(project.gmt,'UTC','')::interval sent_at_gmt FROM ${TABLE_JOB} job
              LEFT JOIN ${TABLE_CARPARK} carpark ON job.car_pound_id = carpark.id
              LEFT JOIN ${TABLE_PROJECT} AS project ON job.project_id = project.id
              LEFT JOIN ${TABLE_ASSET} asset on job.vehicle_codification = asset.codification_id
              WHERE job.cn_number_offline = $1`;
  return postgresClient.query(query, [cn_number_offline]);
};

exports.getJobByCnNumber = (cn_number) => {
  let query = `SELECT job.*,
                job.creation + REPLACE(project.gmt,'UTC','')::interval creation_gmt,
                job.date_end + REPLACE(project.gmt,'UTC','')::interval date_end_gmt,
                job.date_start + REPLACE(project.gmt,'UTC','')::interval date_start_gmt,
                job.sent_at+ REPLACE(project.gmt,'UTC','')::interval sent_at_gmt FROM ${TABLE_JOB} job
              LEFT JOIN ${TABLE_CARPARK} carpark ON job.car_pound_id = carpark.id
              LEFT JOIN ${TABLE_PROJECT} AS project ON job.project_id = project.id
              LEFT JOIN ${TABLE_ASSET} asset on job.vehicle_codification = asset.codification_id
              WHERE job.cn_number = $1`;
  return postgresClient.query(query, [cn_number]);
};

exports.getUnpaidJob = (values) => {
  const car_plate = values.car_plate;
  if (car_plate) {
      return postgresClient.query(
          `SELECT * FROM ${TABLE_JOB} WHERE car_plate = $1 and is_paid != $2`,
          [car_plate, true]
      );
  }
};

exports.getJobByClampedStatus = (params) => {
    const query = `SELECT * FROM ${TABLE_JOB} WHERE status='CLAMPED' AND car_plate = $1`;
    return postgresClient.query(query, [params.car_plate]);
};

exports.getJobByDeClampStatus = (params) => {
  const query = `SELECT * FROM ${TABLE_JOB} WHERE status='DECLAMP REQUESTED' AND job_type = $1 AND project_id = $2`;
  return postgresClient.query(query, [params.job_type, params.project_id]);
};

exports.updateClampPicturesByJobNumber = (body) => {
     return postgresClient.query(
         `UPDATE ${TABLE_JOB} SET clamp_pictures = $1 WHERE job_number = $2`,
         [body.pictures, body.job_number]
     );
};

exports.updateDeclampPicturesByJobNumber = (body) => {
    return postgresClient.query(
        `UPDATE ${TABLE_JOB} SET declamp_pictures = $1 WHERE job_number = $2`,
        [body.pictures, body.job_number]
    );
};

exports.updateTowPicturesByJobNumber = (body) => {
    return postgresClient.query(
        `UPDATE ${TABLE_JOB} SET tow_pictures = $1 WHERE job_number = $2`,
        [body.pictures, body.job_number]
    );
};

exports.updateDefectPicturesByJobNumber = (body) => {
    const defectInfos = body.defect_infos;
    const defects = [];
    const keys = Object.keys(defectInfos);

    keys.map( key => {
        defects.push(defectInfos[key]);
    });
    let pictures = [];

    defects.forEach( element => {
        pictures.push(element.picture);
    });

    const defect_pictures = pictures.join(',');
    return postgresClient.query(
        `UPDATE ${TABLE_JOB} SET defect_pictures = $1, defect_infos = $2 WHERE job_number = $3`,
        [defect_pictures, JSON.stringify(body.defect_infos), body.job_number]
    );
};

exports.getJobByBarcode = (params) => {
    // Only when the job status is 'CLAMPED', the job details can be fetched by clamp_barcode
    const query = `SELECT * FROM ${TABLE_JOB} WHERE clamp_barcode= $1 AND status = 'CLAMPED'`;
    return postgresClient.query(query, [params.bar_code]);
};

exports.updateClampBarCode = (body) => {
    return postgresClient.query(
        `UPDATE ${TABLE_JOB} SET clamp_barcode = $1 WHERE job_number = $2`,
        [body.clamp_barcode, body.job_number]
    );
};


/**
 * Get Tow, Clamp jobs that are created more than 24 hours ago,
 *  but not yet started
 * @param limit: Limit of count
 * @returns {Promise<void>}
 */
exports.getExpiredOpenedJobs = (limit) => {
    let query = `SELECT * FROM ${TABLE_JOB}
        WHERE status in ('TOW REQUESTED', 'CLAMP REQUESTED')        /* Jobs that are not yet started */
            AND creation < NOW() - INTERVAL '24 HOURS'  /* Jobs that are created more than 24 hours ago */
        ORDER BY creation DESC
        `;

    if (limit) {
        query = `${query} LIMIT ${limit};`;
    } else {
        query = `${query};`;
    }

    return postgresClient.query(query);
};
