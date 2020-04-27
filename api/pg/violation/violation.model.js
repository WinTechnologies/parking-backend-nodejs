const client = require('../../../helpers/postgresClient');
const TABLE_VIOLATION = 'violation';
const TABLE_ASSIGNMENT = 'group_violation';

const get = (params) => {
    let query = `SELECT * FROM ${TABLE_VIOLATION}`;
    query += " WHERE deleted_at ISNULL AND deleted_by ISNULL ";
    const args = [];

    Object.keys(params).forEach((field, index, fields) => {
        query += ` AND ${field} = $${index+1} `;
        args.push(params[field]);
    });
    return client.query(query, args);
};

const add = async (params, created_by) => {
    let query = `INSERT INTO ${TABLE_VIOLATION} (
        violation_code,
        violation_name_ar,
        violation_name_en,
        icon_url,
        project_id,
        created_by,
        is_nonpayment,
        created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, current_timestamp)`;
    const args = [
        params.violation_code,
        params.violation_name_ar,
        params.violation_name_en,
        params.icon_url,
        params.project_id,
        created_by,
        params.is_nonpayment
    ];
    return client.query(query, args);
};

const edit = async (body, id) => {
    let query = `UPDATE ${TABLE_VIOLATION} set `;
    Object.keys(body).forEach((field, index, fields) => {
        if (body[field] !== null && field !== 'id') {
            query += `${index === 0 ? ' ' : ', '} ${ field } = '${ body[field] }'`;
        }
    });

    query += ` WHERE id= '${id}';`;

    return client.query(query);
};


const del = async (id, deleted_by) => {
    // const query = `delete from ${TABLE_VIOLATION} where id = $1`;
    const query = `UPDATE ${TABLE_VIOLATION} SET deleted_at = current_timestamp, deleted_by = $1 WHERE id = $2`;
    return client.query(query, [deleted_by, id]);
};

/**
 * For Maps mobile, OSES
 *  Get Violation Assignment List for step 1.
 *  MAPS mobile 1. 1) when mobile call functions: getViolationAssignmentList
 *                 2) server returns a list of 6 assignments that are valid at that time(datetime) in the project
 *                      (assignment = violation + fees defined)
 *                 3) from these 6 assignments, mobile user select 1 (any of these 6) to create a CN
 *
 *  OSES 1. OSES uses Violation Detail API(getViolationDetails) to get assignment_id
 *              and then send it along with CN info
 *  MAPS 2. In Create CN API, with the selected assignment, it would check the detail, if it's a job or not
 *  MAPS 3. if it's a action_tow = True or action_clamp = True, server will create a job
 *
 * @param params {projectId, datetime}
 *  For Maps mobile: datetime: null
 *  For OSES: defined datetime
 * @returns {*}
 */
const getViolationAssignmentList = (params) => {
    const projectId = params.projectId;
    const nowDate = params.datetime ? `'${params.datetime}'::date` : 'now()::date';
    const nowTime = params.datetime ? `'${params.datetime}'::time` : 'now()::time';
    const currentDate = params.datetime ? nowDate : 'current_date';

    const query = `
        SELECT
            violation.id as violation_id,
            violation.violation_code,
            violation.violation_name_en,
            violation.violation_name_ar,
            violation.icon_url,
            violation.is_nonpayment,
            assignment.id as assignment_id,
            assignment.value AS fee,
            assignment.service_fee,
            assignment.late_fee_days,
            assignment.late_fee_value,
            assignment.discount_days,
            assignment.discount_value,
            assignment.observation_min,
            assignment.action_tow,
            assignment.action_clamp,
            assignment.working_days,
            assignment.date_start,
            assignment.date_end,
            assignment.time_start,
            assignment.time_end,
            assignment.zones
        FROM (SELECT gv.id,
                gv.group_id,
                gv.violation_id,
                -- gv.created_at,
                gv.value,
                gv.service_fee,
                gv.late_fee_value,
                gv.late_fee_days,
                gv.discount_value,
                gv.discount_days,
                gv.observation_min,
                gv.action_tow,
                gv.action_clamp,
                gv.zones,
                gv.date_start,
                -- gv.date_end,
                case when gv.date_end ISNULL THEN 'tomorrow'::date ELSE gv.date_end END as date_end,
                gv.working_days,
                -- gv.working_timeslot,
                split_part(unnest(regexp_split_to_array(gv.working_timeslot, ',')), '-', 1)::time AS time_start,
                split_part(unnest(regexp_split_to_array(gv.working_timeslot, ',')), '-', 2)::time AS time_end
            FROM ${TABLE_ASSIGNMENT} gv
            WHERE
                gv.group_id IN (
                    SELECT grp.id
                    FROM groups grp
                    WHERE -- Check groups is not deleted
                        grp.deleted_at ISNULL
                        AND grp.deleted_by ISNULL
                        -- check from project X
                        AND grp.project_id = ${projectId}
                        -- Check validated date of groups
                        AND date_start <= ${nowDate}
                        AND date_end >= ${nowDate}
                    )
                AND gv.working_days LIKE '%' || left(to_char(${currentDate}, 'day'), 3) || '%'
                AND gv.deleted_at ISNULL
                AND gv.deleted_by ISNULL
            ) assignment,
            (SELECT v.id,
                    v.violation_code,
                    v.violation_name_ar,
                    v.violation_name_en,
                    v.icon_url,
                    v.is_nonpayment,
                    v.project_id
                FROM ${TABLE_VIOLATION} v
                WHERE v.deleted_at ISNULL
                    AND v.deleted_by ISNULL
                    AND project_id = ${projectId}
            ) violation
        WHERE violation.id = assignment.violation_id
            -- Check validated date of assignment
            AND assignment.date_start <= ${nowDate}
			AND assignment.date_end >= ${nowDate}
            -- Check validated time of assignment
            AND assignment.time_start <= ${nowTime}
            AND ${nowTime} <= assignment.time_end;`;

    return client.query(query);
};

/**
 * For MAPS Create CN API
 *  Get the assignment Details that was selected in Maps mobile or OSES side
 * @param params {project_id, assignment_id}
 * @returns {*}
 */
const getSelectedAssignment = (params) => {
    const query = `
    SELECT
        violation.id as violation_id,
        violation.violation_code,
        violation.violation_name_en,
        violation.violation_name_ar,
        violation.icon_url as violation_icon_url,
        violation.is_nonpayment as violation_type_nonpayment,
        assignment.id as assignment_id,
        assignment.value AS fee,
        assignment.service_fee,
        assignment.late_fee_days,
        assignment.late_fee_value,
        assignment.discount_days,
        assignment.discount_value,
        assignment.observation_min,
        assignment.action_tow,
        assignment.action_clamp,
        assignment.zones,
        assignment.working_days,
        assignment.date_start,
        assignment.date_end,
        assignment.working_timeslot
        -- assignment.time_start,
        -- assignment.time_end
    FROM (SELECT gv.id,
            gv.group_id,
            gv.violation_id,
            -- gv.created_at,
            gv.value,
            gv.late_fee_value,
            gv.late_fee_days,
            gv.discount_value,
            gv.discount_days,
            gv.observation_min,
            gv.action_tow,
            gv.action_clamp,
            gv.zones,
            gv.date_start,
            -- gv.date_end,
            case when gv.date_end ISNULL THEN 'tomorrow'::date ELSE gv.date_end END as date_end,
            gv.working_days,
            gv.working_timeslot,
            gv.service_fee
            -- split_part(unnest(regexp_split_to_array(gv.working_timeslot, ',')), '-', 1)::time AS time_start,
            -- split_part(unnest(regexp_split_to_array(gv.working_timeslot, ',')), '-', 2)::time AS time_end
        FROM ${TABLE_ASSIGNMENT} gv
        WHERE -- date_start >= now()::date and date_end >= now()::date
            gv.group_id IN (
                    SELECT grp.id
                    FROM groups grp
                    WHERE -- Check groups is not deleted
                        grp.deleted_at ISNULL
                        AND grp.deleted_by ISNULL
                        -- check from project X
                        AND grp.project_id = ${params.project_id}
                        -- Check validated date
                        -- AND date_start <= now()::date
                        -- AND date_end >= now()::date
                )
                AND gv.working_days LIKE '%' || left(to_char(current_date, 'day'), 3) || '%'
                AND gv.deleted_at ISNULL
                AND gv.deleted_by ISNULL
            ) assignment,
            (SELECT v.id,
                v.violation_code,
                v.violation_name_ar,
                v.violation_name_en,
                v.icon_url,
                v.is_nonpayment,
                v.project_id
                FROM ${TABLE_VIOLATION} v
                WHERE v.deleted_at ISNULL
                    AND v.deleted_by ISNULL
                    AND project_id = ${params.project_id}
            ) violation
    WHERE violation.id = assignment.violation_id
        AND assignment.id = ${params.assignment_id};`;
    return client.query(query);
};

/**
 * For Maps mobile, OSES
 * OSES uses Violation Detail API(getViolationDetails) to get assignment_id before sending it along with CN info
 * @param params {projectCd, violationCd, datetime}
 * @returns {*}
 */
const getAssignedViolationDetail = (params) => {
    const projectCd = params.projectCd;
    const violationCd = params.violationCd;
    const nowDate = params.datetime ? `'${params.datetime}'::date` : 'now()::date';

    let query = `
    SELECT
        violation.id as violation_id,
        violation.violation_code,
        violation.violation_name_en,
        violation.violation_name_ar,
        --violation.project_id as violation_project_id,
        --violation.created_at as violation_created_at,
        violation.icon_url as violation_icon_url,
        violation.is_nonpayment as violation_type_nonpayment,

        assignment.id as assignment_id,
        assignment.value AS fee,
        assignment.service_fee,
        assignment.late_fee_days,
        assignment.late_fee_value,
        assignment.discount_days,
        assignment.discount_value,
        assignment.observation_min,
        assignment.action_tow,
        assignment.action_clamp,
        assignment.working_days,
        assignment.date_start,
        assignment.date_end,
        assignment.working_timeslot,
        -- assignment.time_start,
        -- assignment.time_end,
        assignment.zones,

        project.project_code as project_code,
        project.project_name as project_name,
        project.country_name as country,
        project.city_name as city
    FROM
        (SELECT gv.id,
            gv.group_id,
            gv.violation_id,
            -- gv.created_at,
            gv.value,
            gv.late_fee_value,
            gv.late_fee_days,
            gv.discount_value,
            gv.discount_days,
            gv.observation_min,
            gv.action_tow,
            gv.action_clamp,
            gv.date_start,
            gv.date_end,
            gv.working_days,
            gv.working_timeslot,
            gv.service_fee,
            JSON_AGG(project_zone) as zones
        FROM ${TABLE_ASSIGNMENT} gv, project_zone
        WHERE
            gv.group_id IN (
                SELECT grp.id
                FROM groups grp
                WHERE
                    grp.deleted_at ISNULL AND grp.deleted_by ISNULL -- Check groups is not deleted
                    AND date_start <= ${nowDate} -- Check validated date
                    AND date_end >= ${nowDate}
            )
            AND project_zone.id IN (SELECT unnest(gv.zones))
            AND gv.deleted_at ISNULL AND gv.deleted_by ISNULL
        GROUP BY gv.id) assignment,
        (SELECT v.id,
            v.violation_code,
            v.violation_name_ar,
            v.violation_name_en,
            v.icon_url,
            v.is_nonpayment,
            v.project_id
        FROM ${TABLE_VIOLATION} v
        WHERE v.deleted_at ISNULL AND v.deleted_by ISNULL) violation,
        project
    WHERE violation.id = assignment.violation_id AND project.id = violation.project_id
        AND project.project_code = '${projectCd}' -- check from project X
        AND violation.violation_code = '${violationCd}' -- check from violation Y;`;

    return client.query(query);
};

exports.get = get;
exports.add = add;
exports.edit = edit;
exports.del = del;
exports.getViolationAssignmentList = getViolationAssignmentList;
exports.getSelectedAssignment = getSelectedAssignment;
exports.getAssignedViolationDetail = getAssignedViolationDetail;
