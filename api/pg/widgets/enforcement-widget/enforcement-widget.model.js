// const client = require('../../../../helpers/postgresClient');

// const ACT_ENFORCEMENT_PREDICTION = 'act_enforcement_prediction';
// const ACT_ENFORCEMENT_INCENTIVE = 'act_enforcement_incentive';
// const CONTRAVENTION = 'contravention';
// const JOB = 'job';
// const TRANSACTION_TABLE = "transaction_onstreet";

// const get = ({ day, project_id }) => {
//     return Promise.all([
//         // getCurrencyInfo(project_id),
//         // getJobPositionAssignAndPredictions(project_id),
//         // getATVChartInfo(day, project_id),
//         // getIssuanceCNs(day, project_id),
//         // getTowedAndClamped(day, project_id, 'TOW JOB', 'Tow Truck'),
//         // getTowedAndClamped(day, project_id, 'CLAMP JOB', 'Clamp Van'),
//         getGAP(project_id, 'EO'),
//         getGAP(project_id, 'Tow Truck')
//     ]).then(([ eoGapChart, towTruckGapChart ]) => {
//         return { eoGapChart, towTruckGapChart }
//     });
// };

// const getCurrencyInfo = project_id => {
//     return getCurrency(project_id)
//         .then(response => response.rows[0].currency)
// };

// const getJobPositionAssignAndPredictions = (project_id) => {
//     // TODO need to add Clamps
//     const job_position = ['EO', 'Tow Truck', 'Clamp Van'];
//     return Promise.all(job_position.map(position => {
//         return Promise.all([getJobPositionAssign(project_id, position), getJobPositionPrediction(project_id, position)])
//             .then(response => response.map(res => res.rows[0].count))
//     })).then(([eo, tow_truck, clamp_van, clamp]) => {
//         return {
//             eoChart: eo[0] + '/' + eo[1],
//             towTruckChart: tow_truck[0] + '/' + tow_truck[1],
//             clampVanChart: clamp_van[0] + '/' + clamp_van[1]
//         }
//     });
// };

// //TODO need date
// const getGAP = (project_id, job_position) => {
//     return Promise.all([getJobPositionAssign(project_id, job_position), getJobPositionPrediction(project_id, job_position)])
//         .then(([deployed, predicted]) => {
//             return Math.round(predicted.rows[0].count / deployed.rows[0].count)
//         });

// };

// const getIssuanceCNs = (day, project_id) => {
//     return Promise.all([getContraventionsCount(day, project_id), getJobPositionAssign(project_id, 'EO'), getJobPositionPrediction(project_id, 'EO'), getIssuanceRate(project_id, 'EO')])
//         .then(response => response.map(res => res.rows[0].count))
//         .then(([ numberOfCreatedCNs, assign, prediction, issuance_rate ]) => {
//             return {
//                 numberOfCreatedCNs,
//                 deployed: Math.round(assign * (900 / issuance_rate)),
//                 predicted: Math.round(prediction * (900 / issuance_rate))
//             }
//         });
// };

// const getTowedAndClamped = (day, project_id, job_type, job_position) => {
//     return Promise.all([getJobsCount(day, project_id, job_type), getJobPositionAssign(project_id, job_position), getJobPositionPrediction(project_id, job_position)])
//         .then(response => response.map(res => res.rows[0].count))
//         .then(([numberOfJobs, deployed, predicted]) => {
//             return { numberOfJobs, deployed, predicted }
//         });
// };

// const getATVChartInfo = (day, project_id) => {
//     return Promise.all([getContraventionsAmount(day, project_id), getContraventionsCount(day, project_id)])
//         .then(([amount, count]) => Math.round(amount.rows[0].amount / count.rows[0].count));
// };

// const getCurrency = project_id => {
//     let query = "select currency from " + TRANSACTION_TABLE + " ";
//     query += "where project_id = $1 limit 1";

//     return client.query(query, [project_id]);
// };

// const getJobsCount = (day, project_id, job_type) => {
//     let query = "select count(*) from " + JOB + " ";
//     query += "where project_id = $2 ";
//     query += "and job_type = $3 ";
//     query += "and date(date_start)  = $1";

//     return client.query(query, [day, project_id, job_type]);
// };

// const getIssuanceRate = (project_id, job_position) => {
//     let query = "select issuance_rate as count from " + ACT_ENFORCEMENT_PREDICTION + " ";
//     query += "where project_id = $1 ";
//     query += "and job_position = $2";

//     return client.query(query, [project_id, job_position]);
// };

// const getContraventionsAmount = (day, project_id) => {
//     let query = "select coalesce(sum(amount), 0) as amount from " + CONTRAVENTION + " ";
//     query += "where project_id = $2 ";
//     query += "and date(creation)  = $1";

//     return client.query(query, [day, project_id]);
// };

// const getContraventionsCount = (day, project_id) => {
//     let query = "select count(*) from " + CONTRAVENTION + " ";
//     query += "where project_id = $2 ";
//     query += "and date(creation)  = $1";

//     return client.query(query, [day, project_id]);
// };

// const getJobPositionPrediction = (project_id, job_position) => {
//     let query = "select coalesce(forecast_deployed, 0) as count from " + ACT_ENFORCEMENT_PREDICTION + " ";
//     query += "where project_id = $1 ";
//     query += "and job_position = $2";

//     return client.query(query, [project_id, job_position]);
// };

// const getJobPositionAssign = (project_id, job_position) => {
//     let query = "select count(*) from " + ACT_ENFORCEMENT_INCENTIVE + " ";
//     query += "where project_id = $1 ";
//     query += "and job_position = $2";

//     // job_position = job_position === 'EO' ? 'Enforcement Officer' : job_position;
//     // let query = 'select count(*) from project_employee, employee ' +
//     //     ' where project_employee.project_id = $1' +
//     //     'and project_employee.employee_id = employee.employee_id ' +
//     //     'and employee.job_position = $2';

//     return client.query(query, [project_id, job_position]);
// };

// exports.get = get;
