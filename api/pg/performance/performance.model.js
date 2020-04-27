const client = require('../../../helpers/postgresClient');

const TABLE_CONTRAVENTION = 'contravention';
const TABLE_VIOLATION = 'violation';
const TABLE_JOB = 'job';
const TABLE_HHD_TRACKING = 'hhd_tracking';
const TABLE_CONTRAVENTION_STATUS = 'list_contravention_status';
const TABLE_ENFORCER_STATUS = 'list_enforcer_status';

const PLANAR_DEGREES_UNIT = 4326;
const METERS_UNIT = 3857;

exports.getTotalTimeAndDistance = ({employee_id, project_id, from, to}) => {
    const query = `
        WITH time_distance_per_one_track AS (
            SELECT (LEAD(sent_at, 1) OVER w - LEAD(sent_at, 0) OVER w) AS time_interval,
                   ST_DISTANCE(
                       LEAD(ST_TRANSFORM(
                           ST_SETSRID(ST_MAKEPOINT(longitude, latitude)::geometry, ${PLANAR_DEGREES_UNIT}
                       ), ${METERS_UNIT}), 0) OVER w,
                       LEAD(ST_TRANSFORM(
                           ST_SETSRID(ST_MAKEPOINT(longitude, latitude)::geometry, ${PLANAR_DEGREES_UNIT}
                       ), ${METERS_UNIT}), 1) OVER w) AS distance_meters
            FROM ${TABLE_HHD_TRACKING}
            WHERE user_id = $1
              AND sent_at >= $2
              AND sent_at < $3
              ${project_id === null ? '': 'AND project_id = $4'}
                WINDOW w AS (PARTITION BY sent_at::date ORDER BY sent_at ROWS BETWEEN CURRENT ROW AND 1 FOLLOWING)
        )
        SELECT COALESCE(EXTRACT(EPOCH FROM SUM(time_interval)), 0) AS total_time_seconds,
               COALESCE(SUM(distance_meters) / 1000.0, 0)          AS total_distance_kilometers
        FROM time_distance_per_one_track
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};

exports.getCNInterval = ({employee_id, project_id, from, to}) => {
    const query = `
        WITH time_diff_contraventions AS (
            SELECT (LEAD(creation, 1) OVER w - LEAD(creation, 0) OVER w) AS time_interval
            FROM ${TABLE_CONTRAVENTION}
            WHERE creator_id = $1
              AND creation >= $2
              AND creation < $3
              ${project_id === null ? '': 'AND project_id = $4'}
                WINDOW w AS (PARTITION BY creation::date ORDER BY creation ROWS BETWEEN CURRENT ROW AND 1 FOLLOWING)
        )
        SELECT EXTRACT(EPOCH FROM max(time_interval)) AS longest_time_seconds,
               EXTRACT(EPOCH FROM min(time_interval)) AS fastest_time_seconds
        FROM time_diff_contraventions
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};

exports.getCNCntRanking = ({employee_id, project_id, from, to}) => {
    const query = `
        WITH cn_group_creator AS (
            SELECT creator_id,
                   ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS rank,
                   COUNT(*) OVER ()                           AS total_rank
            FROM ${TABLE_CONTRAVENTION}
            WHERE creation >= $2
              AND creation < $3
              ${project_id === null ? '': 'AND project_id = $4'}
            GROUP BY creator_id
        )
        SELECT rank,
               total_rank
        FROM cn_group_creator
        WHERE creator_id = $1
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};

exports.getWpCovering = ({employee_id, project_id, from, to}) => {
    const query = `
        WITH time_per_one_track AS (
            SELECT (LEAD(sent_at, 1) OVER w - LEAD(sent_at, 0) OVER w) AS time_interval,
                   sent_at::date
            FROM ${TABLE_HHD_TRACKING}
            WHERE user_id = $1
              AND sent_at >= $2
              AND sent_at < $3
              ${project_id === null ? '': 'AND project_id = $4'}
              AND user_status IN (SELECT id FROM ${TABLE_ENFORCER_STATUS} WHERE name_en = 'On duty')
                WINDOW w AS (PARTITION BY sent_at::date ORDER BY sent_at ROWS BETWEEN CURRENT ROW AND 1 FOLLOWING)
        ),
             covering_per_day AS (
                 SELECT SUM(time_interval) AS total_time_per_day,
                        sent_at
                 FROM time_per_one_track
                 GROUP BY sent_at
             )
        SELECT ROUND(
            (COALESCE(EXTRACT(EPOCH FROM AVG(total_time_per_day)), 0) / (8 * 60 * 60) * 100)::numeric, 2) AS percent
        FROM covering_per_day
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};

exports.getCNCnt = ({employee_id, project_id, from, to}) => {
    const query = `
        WITH cn_group_date AS (
            SELECT COUNT(*) AS count
            FROM ${TABLE_CONTRAVENTION}
            WHERE creator_id = $1
              AND creation >= $2
              AND creation < $3
              ${project_id === null ? '': 'AND project_id = $4'}
              AND status IN (SELECT status_code FROM ${TABLE_CONTRAVENTION_STATUS} WHERE status_name = 'Contravention')
            GROUP BY creation::date
        )
        SELECT COALESCE(SUM(count), 0) AS count,
               COALESCE(MAX(count), 0) AS max,
               COALESCE(MIN(count), 0) AS min,
               COALESCE(AVG(count), 0) AS avg
        FROM cn_group_date
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};

exports.getDistrOfWorkTimeByStatus = ({employee_id, project_id, from, to}) => {
    const query = `
        WITH user_status_count AS (
            SELECT user_status,
                   COUNT(*) AS count
            FROM ${TABLE_HHD_TRACKING}
            WHERE user_id = $1
              AND sent_at >= $2
              AND sent_at < $3
              ${project_id === null ? '': 'AND project_id = $4'}
            GROUP BY user_status
        )
        SELECT statuses.color,
               statuses.name_en                                                            AS name,
               ROUND(COALESCE(user_status_count.count / SUM(count) over () * 100.0, 0), 2) AS percent
        FROM ${TABLE_ENFORCER_STATUS} statuses
                 LEFT JOIN user_status_count ON statuses.id = user_status_count.user_status
        WHERE user_status_count.count > 0
        ORDER BY statuses.name_en
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};

exports.getDistrOfWorkTimeByDistance = ({employee_id, project_id, from, to}) => {
    const query = `
    WITH distance_diff_contraventions AS (
        SELECT ST_DISTANCE(
                   LEAD(ST_TRANSFORM(
                       ST_SETSRID(ST_MAKEPOINT(longitude, latitude)::geometry, ${PLANAR_DEGREES_UNIT}
                   ), ${METERS_UNIT}), 0) OVER w,
                   LEAD(ST_TRANSFORM(
                       ST_SETSRID(ST_MAKEPOINT(longitude, latitude)::geometry, ${PLANAR_DEGREES_UNIT}
                   ), ${METERS_UNIT}), 1) OVER w) AS d
        FROM ${TABLE_CONTRAVENTION}
        WHERE creator_id = $1
          AND creation >= $2
          AND creation < $3
          ${project_id === null ? '': 'AND project_id = $4'}
            WINDOW w AS (ROWS BETWEEN CURRENT ROW AND 1 FOLLOWING)
    )
    SELECT ROW_NUMBER() over ()                                                                         AS index,
           ROUND((sum(d) over (ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) / 1000.0)::numeric, 3) AS distance
    FROM distance_diff_contraventions
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};

exports.getCNCntByStatus = ({employee_id, project_id, from, to}) => {
    const query = `
        WITH status_count AS (
            SELECT status,
                   COUNT(*) AS count
            FROM ${TABLE_CONTRAVENTION}
            WHERE creator_id = $1
              AND creation >= $2
              AND creation < $3
              ${project_id === null ? '': 'AND project_id = $4'}
            GROUP BY status
        )
        SELECT statuses.status_name            AS name,
               COALESCE(status_count.count, 0) AS count
        FROM ${TABLE_CONTRAVENTION_STATUS} statuses
                 LEFT JOIN status_count ON statuses.status_code = status_count.status
        WHERE status_count.count > 0
        ORDER BY statuses.status_name
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};

exports.getCNCntByViolation = ({employee_id, project_id, from, to}) => {
    const query = `
        SELECT violation AS name,
               COUNT(*)  AS count
        FROM ${TABLE_CONTRAVENTION}
        WHERE creator_id = $1
          AND creation >= $2
          AND creation < $3
          ${project_id === null ? '': 'AND project_id = $4'}
        GROUP BY violation
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};

exports.getViolationCntByViolationType = ({employee_id, project_id, from, to}) => {
    const query = `
    WITH violation_per_hour_count AS (
        SELECT violation_code              AS violation_code,
               EXTRACT(HOUR FROM creation) AS hour,
               COUNT(*)                    AS count
        FROM ${TABLE_CONTRAVENTION}
        WHERE creator_id = $1
          AND creation >= $2
          AND creation < $3
          ${project_id === null ? '': 'AND project_id = $4'}
        GROUP BY violation_code, EXTRACT(HOUR FROM creation)
    )
    SELECT violation.violation_name_en             AS type,
           series.hour,
           COALESCE((SELECT SUM(count)
                     FROM violation_per_hour_count
                     WHERE violation_code = violation.violation_code
                       AND hour = series.hour), 0) AS count
    FROM ${TABLE_VIOLATION} violation,
         GENERATE_SERIES(0, 23) series(hour)
    WHERE violation.violation_code IN (SELECT DISTINCT violation_code FROM violation_per_hour_count)
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};

exports.getViolationCntByPlateType = ({employee_id, project_id, from, to}) => {
    const query = `
    WITH plate_type_per_hour_count AS (
        SELECT plate_type                  AS type,
               EXTRACT(HOUR FROM creation) AS hour,
               COUNT(*)                    AS count
        FROM ${TABLE_CONTRAVENTION}
        WHERE creator_id = $1
          AND creation >= $2
          AND creation < $3
          ${project_id === null ? '': 'AND project_id = $4'}
        GROUP BY contravention.plate_type, EXTRACT(HOUR FROM creation)
    )
    SELECT vehicle_plate_type.type_name_en         AS type,
           series.hour,
           COALESCE((SELECT SUM(count)
                     FROM plate_type_per_hour_count
                     WHERE type = vehicle_plate_type.type_name_en
                       AND hour = series.hour), 0) AS count
    FROM vehicle_plate_type,
         GENERATE_SERIES(0, 23) series(hour)
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};

exports.getJobCntByTriggered = ({employee_id, project_id, from, to}) => {
    const query = `
        SELECT SUM(CASE WHEN contravention.cn_number_offline IS NOT NULL THEN 1 ELSE 0 END) AS triggered,
               SUM(CASE WHEN contravention.cn_number_offline IS NULL THEN 1 ELSE 0 END)     AS non_triggered
        FROM ${TABLE_JOB} job
                 LEFT JOIN ${TABLE_CONTRAVENTION} contravention
                     ON contravention.cn_number_offline = job.cn_number_offline
        WHERE job.creator_id = $1
          AND job.creation >= $2
          AND job.creation < $3
          ${project_id === null ? '': 'AND job.project_id = $4'}
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};

exports.getJobCntByType = ({employee_id, project_id, from, to}) => {
    const query = `
        SELECT INITCAP(TRIM(TRIM(TRAILING 'JOB' FROM job.job_type))) AS type,
               COUNT(*)                                              AS count
        FROM ${TABLE_JOB} job
                 JOIN ${TABLE_CONTRAVENTION} contravention
                     ON contravention.cn_number_offline = job.cn_number_offline
        WHERE job.creator_id = $1
          AND job.creation >= $2
          AND job.creation < $3
          ${project_id === null ? '': 'AND job.project_id = $4'}
        GROUP BY job.job_type
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};

exports.getViolationCntByStreet = ({employee_id, project_id, from, to}) => {
    const query = `
        SELECT street_name_en AS name,
               COUNT(*)       AS count
        FROM ${TABLE_CONTRAVENTION}
        WHERE creator_id = $1
          AND creation >= $2
          AND creation < $3
          ${project_id === null ? '': 'AND project_id = $4'}
        GROUP BY street_name_en
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};

exports.getWalkingDistancePerDay = ({employee_id, project_id, from, to}) => {
    const query = `
        WITH distance_per_one_track AS (
            SELECT sent_at::date,
                   ST_DISTANCE(
                       LEAD(ST_TRANSFORM(
                           ST_SETSRID(ST_MAKEPOINT(longitude, latitude)::geometry, ${PLANAR_DEGREES_UNIT}
                       ), ${METERS_UNIT}), 0) OVER w,
                       LEAD(ST_TRANSFORM(
                           ST_SETSRID(ST_MAKEPOINT(longitude, latitude)::geometry, ${PLANAR_DEGREES_UNIT}
                       ), ${METERS_UNIT}), 1) OVER w) AS distance_meters
            FROM ${TABLE_HHD_TRACKING}
            WHERE user_id = $1
              AND sent_at >= $2
              AND sent_at < $3
              ${project_id === null ? '': 'AND project_id = $4'}
                WINDOW w AS (PARTITION BY sent_at::date ORDER BY sent_at ROWS BETWEEN CURRENT ROW AND 1 FOLLOWING)
        ), distance_per_day AS (
            SELECT sent_at, COALESCE(SUM(distance_meters) / 1000.0, 0) AS distance_kilometers
            FROM distance_per_one_track
            GROUP BY sent_at
        )
        SELECT AVG(distance_kilometers)::numeric(11, 3) AS distance_kilometers
        FROM distance_per_day
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};

exports.getMinutesForObservation = ({employee_id, project_id, from, to}) => {
    const query = `
        WITH avg_observation_time_per_hour AS (
            SELECT EXTRACT(HOUR FROM creation::time) AS hour,
                   AVG(observation_time)             AS avg_observation_time
            FROM ${TABLE_CONTRAVENTION}
            WHERE creator_id = $1
              AND creation >= $2
              AND creation < $3
              ${project_id === null ? '': 'AND project_id = $4'}
              AND observation_time > 0
            GROUP BY EXTRACT(HOUR FROM creation::time)
        )
        SELECT series.hour,
               COALESCE(avg_observation_time_per_hour.avg_observation_time, 0)::numeric(11, 2) AS avg_observation_time
        FROM GENERATE_SERIES(0, 23) series(hour)
                 LEFT JOIN avg_observation_time_per_hour ON avg_observation_time_per_hour.hour = series.hour
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};

exports.getMovement = ({employee_id, project_id, from, to}) => {
    const query = `
        SELECT latitude,
               longitude,
               sent_at::date
        FROM ${TABLE_HHD_TRACKING}
        WHERE user_id = $1
          AND sent_at >= $2
          AND sent_at < $3
          ${project_id === null ? '': 'AND project_id = $4'}
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};

exports.getContraventionsForMap = ({employee_id, project_id, from, to}) => {
    const query = `
        SELECT cn_number_offline,
               latitude,
               longitude,
               creation
        FROM ${TABLE_CONTRAVENTION}
        WHERE creator_id = $1
          AND creation >= $2
          AND creation < $3
          ${project_id === null ? '': 'AND project_id = $4'}
    `;

    const args = project_id === null ? [employee_id, from, to] : [employee_id, from, to, project_id];
    return client.query(query, args);
};
