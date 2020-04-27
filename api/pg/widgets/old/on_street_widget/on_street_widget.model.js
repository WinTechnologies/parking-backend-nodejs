// const client = require('../../../../helpers/postgresClient');
// const helpers = require('./helpers');

// const TRANSACTION_TABLE = "transaction_onstreet";
// const CONTRAVENTION_TABLE = "contravention";
// const ASSET_TABLE = "asset_2";
// const ACT_ENFORCEMENT_PREDICTION = "act_enforcement_prediction";

// const get = async ({ day, project_id }) => {
//     return Promise.all([
//         getCurrencyInfo(project_id),
//         getViolationsChartInfo(day, project_id),
//         getPaymentChartInfo(day, project_id),
//         getRevenueChartInfo(day, project_id),
//         getParkingMeterChartInfo(day, project_id),
//         getATVChartInfo(day, project_id),
//         getSpacesChartInfo(day, project_id),
//         getPaidOccupancyChartInfo(day, project_id),
//         getALSChartInfo(day, project_id),
//         getRevenuePerSpaceChart(day, project_id)
//     ]).then(([currency, violationsChart, paymentChart, revenueChart, parkingMeterChart, atvChart, spacesChart, paidOccupancyChart, alsChart, revenuePerSpaceChart]) => {
//         return { currency, violationsChart, paymentChart, revenueChart, parkingMeterChart, atvChart, spacesChart, paidOccupancyChart, alsChart, revenuePerSpaceChart }
//     })
// };

// const getPaymentChartInfo = (day, project_id) => {
//     const paymentModes = ['eWallet', 'Coins', 'Cards'];
//     return Promise.all(paymentModes.map(mode => getSumByPaymentMode(day, project_id, mode)))
//         .then(result => helpers.paymentResult(result, paymentModes));
// };

// const getViolationsChartInfo = async (day, project_id) => {
//     return Promise.all([getViolationsCount(day, project_id), getTransactionsCount(day, project_id)])
//         .then(response => response.map(res => res.rows[0].count))
//         .then(([violations, transactions]) => {
//             const sum = +violations + +transactions;
//             return {
//                 violations: sum > 0 ? violations * 100 / sum : 0,
//                 transactions: sum > 0 ? transactions * 100 / sum : 0
//             }
//         })
// };

// const getParkingMeterChartInfo = (day, project_id) => {
//     return Promise.all([getWorkingPND(day, project_id), getPNDCount(project_id)])
//         .then(([working, sum]) => {
//             return {
//                 working: working.rows[0].count,
//                 sum: sum.rows[0].count
//             }
//         })
// };

// const getRevenueChartInfo = (day, project_id) => {
//     return getAmount(day, project_id)
//         .then(response => response.rows[0].amount);
// };

// const getATVChartInfo = (day, project_id) => {
//     return Promise.all([getAmount(day, project_id), getTransactionsCount(day, project_id)])
//         .then(([amount, transactions]) => Math.round(amount.rows[0].amount / transactions.rows[0].count));
// };

// const getCurrencyInfo = project_id => {
//     return getCurrency(project_id)
//         .then(response => response.rows[0].currency)
// };

// const getALSChartInfo = (day, project_id) => {
//     return getAverageTime(day, project_id)
//         .then(res => res.rows[0].count ? res.rows[0].count.toFixed(1) : res.rows[0].count);
// };

// const getRevenuePerSpaceChart = (day, project_id) => {
//     return Promise.all([getAmount(day, project_id, '1 year'), getSpacesCount(project_id)])
//         .then(([revenue, total]) => Math.round(revenue.rows[0].amount / total.rows[0].count));
// };

// const getPaidOccupancyChartInfo = (day, project_id) => {
//     return Promise.all([getWorkingPND(day, project_id), getSpacesCount(project_id)])
//         .then(([working, total]) => {
//             const workingPND = +working.rows[0].count;
//             return workingPND > 0 ? (workingPND / total.rows[0].count) * 100 : 0;
//         })
// };

// const getSpacesChartInfo = (day, project_id) => {
//     return Promise.all([getWorkingPND(day, project_id), getSpacesCount(project_id)])
//         .then(([working, total]) => {
//             const totalSpaces = total.rows[0].count;
//             return {
//                 available: totalSpaces - +working.rows[0].count,
//                 total: totalSpaces
//             }
//         })
// };

// const getAverageTime = (day, project_id) => {
//     // let query = "select date_part('hours', sum(enddate - startdate)) / count(*) as count from " + TRANSACTION_TABLE + " ";
//     // query += "where project_id = $2 ";
//     // query += "and date_trunc('day', startdate)  = timestamp $1;";
//     const query = `select date_part('hours', sum(enddate - startdate)) / count(*) as count from ${TRANSACTION_TABLE}
//     where project_id = $2 and date_trunc('day', startdate)  = timestamp $1`;

//     return client.query(query, [day, project_id]);
// };

// const getSpacesCount = project_id => {
//     // let query = "select nbr_spaces_on_street_parking as count from act_enforcement_prediction ";
//     // query += "where project_id = $1 ";
//     // query += "limit 1";
//     const query = `select nbr_spaces_on_street_parking as count from ${ACT_ENFORCEMENT_PREDICTION} 
//     where project_id = $1 limit 1`;

//     return client.query(query, [project_id]);
// };

// const getSumByPaymentMode = (day, project_id, mode) => {
//     // let query = "select count(*) from " + TRANSACTION_TABLE + " ";
//     // query += "where date(enddate) = $1 ";
//     // query += "and project_id = $2 ";
//     // query += "and payment_mode = $3";
//     const query = `select count(*) from ${TRANSACTION_TABLE} 
//     where date(enddate) = $1 and project_id = $2 and payment_mode = $3`;

//     return client.query(query, [day, project_id, mode]);
// };

// const getAmount = (day, project_id, interval) => {
//     let query = "select sum(amount) as amount from " + TRANSACTION_TABLE + " ";
//     query += "where enddate " + (interval ? ">= ($1::date -'" + interval + "'::interval)::date and enddate <= $1 " : "= $1 ");
//     query += "and project_id = $2";

//     return client.query(query, [day, project_id]);
// };

// const getViolationsCount = (day, project_id) => {
//     // let query = "select count (*) from " + CONTRAVENTION_TABLE + " ";
//     // query += "where project_id = $2 ";
//     // query += "and date(creation) = $1";
//     const query = `select count (*) from ${CONTRAVENTION_TABLE} 
//     where project_id = $2 and date(creation) = $1`;

//     return client.query(query, [day, project_id]);
// };

// const getTransactionsCount = (day, project_id) => {
//     // let query = "select count (*) from " + TRANSACTION_TABLE + " ";
//     // query += "where project_id = $2 ";
//     // query += "and date(enddate) = $1";
//     const query = `select count (*) from ${TRANSACTION_TABLE} 
//     where project_id = $2 and date(enddate) = $1`;


//     return client.query(query, [day, project_id]);
// };

// const getCurrency = project_id => {
//     // let query = "select currency from " + TRANSACTION_TABLE + " ";
//     // query += "where project_id = $1 limit 1";
//     const query = `select currency from ${TRANSACTION_TABLE} where project_id = $1 limit 1`;

//     return client.query(query, [project_id]);
// };

// const getWorkingPND = (day, project_id) => {
//     //TODO: need to add day
//     // let query = "select count(*) from " + ASSET_TABLE + " ";
//     // query += "where project_id = $1 ";
//     // query += "and status = 'Installed' ";
//     // query += "and date_created = $2 ";
//     // query += "and type_asset = 'PND'";
//     const query = `select count(*) from ${ASSET_TABLE} 
//     where project_id = $1 
//     and status = 'Installed' 
//     and SUBSTRING(to_char(asset.created_at, 'YYYY-MM-DD') FROM 1 FOR 10) = $2 
//     and type_asset = 'PND'`;

//     return client.query(query, [project_id, day]);
// };

// const getPNDCount = project_id => {
//     // let query = "select count(*) from " + ASSET_TABLE + " ";
//     // query += "where project_id = $1 ";
//     // query += "and type_asset = 'PND'";
//     const query = `select count(*) from ${ASSET_TABLE} 
//     where project_id = $1 
//     and type_asset = 'PND'`;

//     return client.query(query, [project_id]);
// };

// exports.get = get;