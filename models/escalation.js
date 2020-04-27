const postgresClient = require('../helpers/postgresClient');
const violationModel = require("./../api/pg/violation/violation.model");
const jobModel = require("../api/jobs/job.model");
const OSESLogger = require("../helpers/mawgifLogger");
const MQTTpublisher = require("../api/services/MQTT/publisher");
const { MqttSubject, ViolationDecision } = require('../api/contravention/constants');

const DaysBetween = function (date1, date2) {
  date1 = new Date(date1);
  date2 = new Date(date2);
  //Get 1 day in milliseconds
  var one_day = 1000 * 60 * 60 * 24;

  // Convert both dates to milliseconds
  var date1_ms = date1.getTime();
  var date2_ms = date2.getTime();

  // Calculate the difference in milliseconds
  var difference_ms = date2_ms - date1_ms;

  // Convert back to days and return
  return Math.round(difference_ms / one_day);
};

/**
 * @param job
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise<*>}
 */
const createMAPSJob = async (job, req = null) => {
  const createdJob = await jobModel.createJob(job);

  if (createdJob && createdJob.rowCount > 0) {
    OSESLogger('info', {
        subject: 'Create MAPS Job',
        message: `${createdJob.rows[0].job_number} from CN #${createdJob.rows[0].cn_number_offline}`
    }, req);
    return createdJob.rows[0].job_number;

  } else {
    OSESLogger('error', { subject: 'Create MAPS Job', message: 'Not created!' }, req);
    return null;
  }
};

/**
 * 1. If cn.reference is null, Create OSES VRM
 * 2. Create MAPS Job
 * 2. Create OSES Ticket, if error, return
 * 3. Create OSES Job
 * @param cn: CN Data from logicByAssignment() or logicByEscalation()
 * @param service_fee - number (Job fee)
 * @param action_tow - TRUE | FALSE
 * @param action_clamp - TRUE | FALSE
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise<{jobNumber: number | null}>}
 */
const createJob = async function (cn, service_fee, action_tow, action_clamp, req = null) {

    let jobNumber;

    let job = { ...cn };
    job['creation'] = new Date(cn['creation']).toISOString();
    job['amount'] = service_fee ? service_fee : 0;

    if (action_tow === true) {
        job['job_type'] = 'TOW JOB';
        job['status'] = 'TOW REQUESTED';
    } else if (action_clamp === true) {
        job['job_type'] = 'CLAMP JOB';
        job['status'] = 'CLAMP REQUESTED';
    }

    if (cn.plate_picture && cn.violation_picture) {
        job['violation_pictures'] = [cn.plate_picture, cn.violation_picture].join(',');
    } else {
        job['pictures_of_cars'] = [];
    }

    try {
        /* Step2: create MAPS Job */
        const needJob = action_tow || action_clamp;
        if (needJob) {
            jobNumber = await createMAPSJob(job);
            if (jobNumber) {
                job['job_number'] = jobNumber;
                MQTTpublisher.client.publish(MqttSubject.CreatedJob, JSON.stringify(job));
            }
        } else {
            OSESLogger('log', { subject: 'Create MAPS Job', message: 'No Job required' }, req);
        }

        return { jobNumber };

    } catch (err) {
        // ignore err.message === 'Create OSES VRMCode Error'
        // ignore err.message === 'Update OSES VRMCode Error'
        // if (err.message === 'Create OSES Ticket Error') {
        //     OSESTicket_Failed = true;
        // } else if (err.message === '‌Create OSES Job Error') {
        //     OSESJob_Failed = true
        // }
        OSESLogger('error', { subject: 'Create Job ERROR', message: err.message }, req);
        return { jobNumber };
    }
};

/**
 * Create MAPS Job, OSES VRM, OSES Ticket, OSES Job by Violation Assignment rule
 *    1. ViolationDecision.Clamp('Direct Clamp')     -> (Ticket + directly Clamp Job)
 *    2. ViolationDecision.Tow('Direct TOW')         -> (Ticket + directly Tow Job)
 * @param cn: CN data with project_id, project_gmt, vat_id
 * @param currentUser
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise<{jobNumber: number | null}>}
 */
const logicByAssignment = async function (cn, currentUser, req = null) {
    if (!cn || !cn.assignment_id) {
        return {
            jobNumber: null,
        };
    }

    const assignment = await violationModel.getSelectedAssignment({
        project_id: cn.project_id,
        assignment_id: cn.assignment_id,
    });

    if (assignment && assignment.rowCount > 0
        && (
            (assignment.rows[0].action_tow === true && cn.violation_decision === ViolationDecision.Tow)
            || (assignment.rows[0].action_clamp === true && cn.violation_decision === ViolationDecision.Clamp)
        )
    ) {
        // { service_fee, action_tow, action_clamp }
        const violation = assignment.rows[0];
        const { service_fee, action_tow, action_clamp } = violation;

        // { jobNumber }
        return await createJob(cn, service_fee, action_tow, action_clamp, req);
    } else {
        return {
            jobNumber: null,
        };
    }
};

/**
 * Create MAPS Job, OSES VRM, OSES Ticket, OSES Job By Escalation rule
 *    1. ViolationDecision.Ticket('Direct Ticket') -> Tow or Clamp Job according to matched Escalation Rules
 *    2. Transformed to CN from Observation        -> Tow or Clamp Job according to matched Escalation Rules
 * @param cn: CN data with project_id, project_gmt, vat_id
 * @param req <{ baseUrl, originalUrl, method, param, query, body } | null>
 * @returns {Promise<{jobNumber: (number|null)}>}
 */
const logicByEscalation = async (cn, req = null) => {
    // TODO: temporarily disable Escalation only for PROD env
    if (process.env.NODE_ENV === 'production') {
        return {
            jobNumber: null,
        };
    }

    const [
        { matchedRule: matchedRule1, unpaidCNs: unpaidCNs1 },
        { matchedRule: matchedRule2, unpaidCNs: unpaidCNs2 }
    ] = await Promise.all([
        checkOnlyViolationNbr(cn.car_plate),
        checkAllNbrs(cn.car_plate),
    ]);

    let matchedRule = null;
    let towRules = [matchedRule1, matchedRule2].filter(rule => rule && rule.action_tow);
    let clampRules = [matchedRule1, matchedRule2].filter(rule => rule && rule.action_clamp);

    // Priority tow > clamp
    if (towRules.length > 0) {
        matchedRule = towRules.sort((rule1, rule2) => rule1.service_fee > rule2.service_fee)[0];
    } else if (clampRules.length > 0){
        matchedRule = clampRules.sort((rule1, rule2) => rule1.service_fee > rule2.service_fee)[0];
    }

    if (!matchedRule) {
        return {
            jobNumber: null,
        };
    }

    // TODO: unpaidCNs1, unpaidCNs2
    const { service_fee, action_tow, action_clamp } = matchedRule;
    // { jobNumber }
    return await createJob(cn, service_fee, action_tow, action_clamp, req);
};

/**
 * Case 1. Retrieve the list of escalation whose // TODO: check project_id and zone_id
 *    - logical_rule is not 'And'
 *    - outstanding_violation_nbr not null
 * @returns
 * [{
 *    name,
 *    nbr_cn,
 *    action_tow, action_clamp,
 *    service_fee
 * }]
 */
const retrieveEscalations1 = () => {
    const query = `
        SELECT
          escalation_name AS name,
          outstanding_violation_nbr AS nbr_cn,
          CASE WHEN outstanding_violation_tow = TRUE THEN TRUE END AS action_tow,
          CASE WHEN outstanding_violation_clamp = TRUE THEN TRUE END AS action_clamp,
          SUM(COALESCE( fee_tow, 0 ) + COALESCE( fee_clamp, 0 )) AS service_fee
        FROM escalation
        WHERE deleted_at notnull AND deleted_by notnull
          AND outstanding_violation_nbr notnull
          AND logical_rule != 'And'
        GROUP BY escalation_name, outstanding_violation_nbr, outstanding_violation_tow, outstanding_violation_clamp`;

    return postgresClient.query(query);
};

/**
 * Case 2. Retrieve the list of escalation whose // TODO: check project_id and zone_id
 *    - logical_rule is 'And'
 *    - outstanding_days_nbr not null
 *    - outstanding_violation_nbr not null
 * @returns
 * [{
 *    name,
 *    escal_nbr_unpaid_cn, escal_nbr_unpaid_days,
 *    action_tow, action_clamp,
 *    service_fee,
 *    storage_fee, fee_per_unit,
 *    storage_max,  fee_per_unit_max
 *  }]
 */
const retrieveEscalations2 = () => {
    const query = `
        SELECT
            escalation_name AS name,
            outstanding_violation_nbr AS escal_nbr_unpaid_cn,
            outstanding_days_nbr AS escal_nbr_unpaid_days,
            CASE WHEN outstanding_violation_tow = TRUE THEN TRUE END AS action_tow,
            CASE WHEN outstanding_violation_clamp = TRUE THEN TRUE END AS action_clamp,
            SUM(COALESCE( fee_tow, 0 ) + COALESCE( fee_clamp, 0 )) AS service_fee,
            COALESCE( storage_fee, 0 ) AS storage_fee,
            COALESCE( storage_max, 0 ) AS storage_max,
            CONCAT(COALESCE( storage_fee, 0 ), ' ', storage_fee_unit) AS fee_per_unit,
            CONCAT(COALESCE( storage_max, 0 ) , ' ', storage_max_unit) AS fee_per_unit_max
        FROM escalation
        WHERE deleted_at notnull AND deleted_by notnull
            AND outstanding_violation_nbr notnull
            AND outstanding_days_nbr notnull
            AND logical_rule = 'And'
        GROUP BY escalation_name, outstanding_violation_nbr, outstanding_violation_tow,
                 outstanding_days_nbr, outstanding_violation_clamp,
                 storage_fee, storage_fee_unit, storage_max, storage_max_unit`;

    return postgresClient.query(query);
};

/**
 * Case 1. Retrieve only unpaid CNs of a car
 * @param carPlate
 * @returns
 *  {
 *    outstand_violations: number of CNs,
 *    violations: [CN1, CN2, CN3, ...]: Array<CN>
 *  }
 */
const retrieveUnpaidCNs1 = (carPlate) => {
    const query = `
        SELECT count(*) AS outstand_violations, JSON_AGG(contravention) AS violations
        FROM contravention
        WHERE is_paid IS NOT TRUE AND car_plate = '${carPlate}'`;

    return postgresClient.query(query);
};

/**
 * Case 2. For a car, retrieve CNs that is unpaid or exceeds outstanding days
 * @param carPlate
 * @returns
 *  {
 *      outstand_violations: number of CNs,
 *      outstand_days: number of days,
 *      diff_date: '0 years 0 mons 135 days 20 hours 16 mins 4.537747 secs'
 *      violations: [CN1, CN2, CN3, ...]: Array<CN>
 *  }
 */
const retrieveUnpaidCNs2 = (carPlate) => {
    const query = `
        SELECT outstand_violations, outstand_days, diff_date, violations
        FROM
            (
            -- Step 2.1. Retrieve the number of unpaid CN of the car
                    SELECT count(*) AS outstand_violations,
                           JSON_AGG(contravention) AS violations
                    FROM contravention
                    WHERE is_paid IS NOT TRUE AND car_plate = '${carPlate}'
            ) t1,
            (
            -- Step 2.2. Retrieve the number of day of the unpaid CN
                SELECT  now() - creation AS diff_date,
                        extract(DAYS from now() - creation) AS outstand_days
                FROM contravention
                WHERE is_paid IS NOT TRUE
                    AND car_plate = '${carPlate}'
                ORDER BY outstand_days DESC
                LIMIT 1
            ) t2`;

    return postgresClient.query(query);
};

/**
 * Retrieve Latest unpaid Contravention
 * @param carPlate
 * @returns {CN}
 */
const retrieveLatestUnpaidCN = (carPlate) => {
    const query = `
        SELECT *
        FROM contravention
        WHERE is_paid IS NOT TRUE
          AND car_plate = '${carPlate}'
          AND creation = (SELECT max(creation)
                            FROM contravention
                            WHERE is_paid IS NOT TRUE
                            AND car_plate = '${carPlate}')`;

    return postgresClient.query(query);
};

/**
 * Escalation Check1 - Check only outstanding_violation_nbr
 * Simple case: Escalation rules that have only Outstanding Violation Number
 * Combination case: Escalation rules that have Outstanding Violation Number and OR logic
 * @param carPlate
 * @returns {Promise<{
 *  matchedRule: { name, nbr_cn,  action_tow, action_clamp, service_fee } | null,
 *  unpaidCNs: Array<CN>
 *  }>}
 */
const checkOnlyViolationNbr = async (carPlate) => {
    let [escalations, unpaidCNList1, latestCNs] = await Promise.all([
        retrieveEscalations1(),
        retrieveUnpaidCNs1(carPlate),
        retrieveLatestUnpaidCN(carPlate),
    ]);

    escalations = escalations.rows;
    latestCNs = latestCNs.rows;
    const nbrUnpaidCNs = unpaidCNList1.rows && unpaidCNList1.rows.length > 0
        ? parseInt(unpaidCNList1.rows[0].outstand_violations)
        : 0;
    const unpaidCNs = unpaidCNList1.rows && unpaidCNList1.rows.length > 0
        ? unpaidCNList1.rows[0].violations
        : [];

    // Escalation1: [{ name, nbr_cn, action_tow, action_clamp, service_fee }]
    const filteredRules = escalations.filter(rule => nbrUnpaidCNs > rule.nbr_cn);

    let matchedRule = null;
    let towRules = filteredRules.filter(rule => rule.action_tow);
    let clampRules = filteredRules.filter(rule => rule.action_clamp);

    // Priority tow > clamp
    if (towRules.length > 0) {
        matchedRule = towRules.sort((rule1, rule2) => rule1.service_fee > rule2.service_fee)[0];
    } else if (clampRules.length > 0) {
        matchedRule = clampRules.sort((rule1, rule2) => rule1.service_fee > rule2.service_fee)[0];
    }

    return { matchedRule, unpaidCNs };
};

/**
 * Escalation Check2 - Check outstanding_violation_nbr and outstanding_day_nbr
 * Combination case: Escalation rules that have Outstanding Violation Number and AND logic
 * @param carPlate
 * @returns {Promise<{
 *  matchedRule: {
 *    name, escal_nbr_unpaid_cn, escal_nbr_unpaid_days,
 *    action_tow, action_clamp, service_fee,
 *    storage_fee, fee_per_unit, storage_max,  fee_per_unit_max,
 *  } | null,
 *  unpaidCNs: Array<CN>
 *  }>}
 */
const checkAllNbrs = async (carPlate) => {
    let [
        escalations,
        unpaidCNList2,
        latestCNs,
    ] = await Promise.all([
        retrieveEscalations2(),
        retrieveUnpaidCNs2(carPlate),
        retrieveLatestUnpaidCN(carPlate),
    ]);

    escalations = escalations.rows;
    latestCNs = latestCNs.rows;
    const nbrUnpaidCNs = unpaidCNList2.rows && unpaidCNList2.rows.length > 0
        ? parseInt(unpaidCNList2.rows[0].outstand_violations)
        : 0;
    const nbrDays = unpaidCNList2.rows && unpaidCNList2.rows.length > 0
        ? parseInt(unpaidCNList2.rows[0].outstand_days)
        : 0;
    const unpaidCNs = unpaidCNList2.rows && unpaidCNList2.rows.length > 0
        ? unpaidCNList2.rows[0].violations
        : [];

    /**
    * Escalation2 [{
    *     name,
    *     escal_nbr_unpaid_cn, escal_nbr_unpaid_days,
    *     action_tow, action_clamp,
    *     service_fee,
    *     storage_fee, fee_per_unit,
    *     storage_max,  fee_per_unit_max
    * }]
    */
    const filteredRules = escalations.filter(rule => {
        return nbrUnpaidCNs > rule.escal_nbr_unpaid_cn && nbrDays > rule.escal_nbr_unpaid_days
    });

    let matchedRule = null;
    let towRules = filteredRules.filter(rule => rule.action_tow);
    let clampRules = filteredRules.filter(rule => rule.action_clamp);

    // Priority tow > clamp
    if (towRules.length > 0) {
        matchedRule = towRules.sort((rule1, rule2) => rule1.service_fee > rule2.service_fee)[0];
    } else if (clampRules.length > 0) {
        matchedRule = clampRules.sort((rule1, rule2) => rule1.service_fee > rule2.service_fee)[0];
    }

    return { matchedRule, unpaidCNs };
};

exports.logicByAssignment = logicByAssignment;
exports.logicByEscalation = logicByEscalation;
