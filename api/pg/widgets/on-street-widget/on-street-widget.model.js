// const client = require('../../../../helpers/postgresClient');
// const helpers = require('./helpers');

// const TRANSACTION_TABLE = "transaction_onstreet";
// const CONTRAVENTION_TABLE = "contravention";
// const ASSET_TABLE = "asset_2"; // "asset";
// const ASSET_MODEL_TABLE = "asset_model_2";
// const ASSET_TYPE_TABLE = "asset_type_2";
// const PARKING_TABLE = "parking";

// const get = async ({ day, project_id }) => {
//     return Promise.all([
//         // getCurrencyInfo(project_id),
//         // getViolationsChartInfo(day, project_id),
//         // getPaymentChartInfo(day, project_id),
//         // getRevenueChartInfo(day, project_id),
//         getParkingMeterChartInfo(day, project_id),
//         // getATVChartInfo(day, project_id),
//         getSpacesChartInfo(day, project_id),
//         getPaidOccupancyChartInfo(day, project_id),
//         // getALSChartInfo(day, project_id),
//         // getRevenuePerSpaceChart(day, project_id)
//     ]).then(([currency, violationsChart, paymentChart, revenueChart, parkingMeterChart, atvChart, spacesChart, paidOccupancyChart, alsChart, revenuePerSpaceChart]) => {
//         return { currency, violationsChart, paymentChart, revenueChart, parkingMeterChart, atvChart, spacesChart, paidOccupancyChart, alsChart, revenuePerSpaceChart }
//     });
// };

// const getCurrencyInfo = project_id => {
//     return getCurrency(project_id)
//         .then(response => response.rows[0].currency)
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

// const getPaymentChartInfo = (day, project_id) => {
//     return getSumWithPaymentMode(day, project_id)
//         .then(result => helpers.paymentResult(result.rows));
// };

// const getRevenueChartInfo = (day, project_id) => {
//     return getAmount(day, project_id)
//         .then(response => response.rows[0].amount);
// };

// const getParkingMeterChartInfo = (day, project_id) => {
//     return getAssetsByType(day, project_id, 'Parking Meter');
// };

// const getATVChartInfo = (day, project_id) => {
//     return Promise.all([getAmount(day, project_id), getTransactionsCount(day, project_id)])
//         .then(([amount, transactions]) => Math.round(+transactions.rows[0].count ? amount.rows[0].amount / transactions.rows[0].count : amount.rows[0].amount));
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

// const getPaidOccupancyChartInfo = (day, project_id) => {
//     return Promise.all([getWorkingPND(day, project_id), getSpacesCount(project_id)])
//         .then(([working, total]) => {
//             const workingPND = +working.rows[0].count;
//             return workingPND > 0 ? (workingPND / total.rows[0].count) * 100 : 0;
//         })
// };

// const getALSChartInfo = (day, project_id) => {
//     return getAverageTime(day, project_id)
//         .then(res => res.rows[0].count ? res.rows[0].count.toFixed(1) : res.rows[0].count);
// };

// const getRevenuePerSpaceChart = (day, project_id) => {
//     return Promise.all([getAmount(day, project_id), getSpacesCount(project_id)])
//         .then(([revenue, total]) => Math.round(revenue.rows[0].amount / total.rows[0].count));
// };

// const getAverageTime = (day, project_id) => {
//     let query = "select coalesce(date_part('hours', sum(enddate - startdate)) / count(*), 0) as count from " + TRANSACTION_TABLE + " ";
//     query += "where project_id = $2 ";
//     query += "and date(startdate) = $1;";

//     return client.query(query, [day, project_id]);
// };

// const getSpacesCount = project_id => {
//     let query = `select coalesce(sum(parking_spaces), 0) as count from ${PARKING_TABLE} `;
//     query += 'where project_id = $1';

//     return client.query(query, [project_id]);
// };

// const getSumWithPaymentMode = (day, project_id) => {
//     let query = `select count(*) count, payment_mode from ${TRANSACTION_TABLE} `;
//     query += `where project_id = $2 `;
//     query += `and date(startdate) = $1 `;
//     query += `group by payment_mode`;

//     return client.query(query, [day, project_id]);
// };

// const getAmount = (day, project_id) => {
//     let query = "select coalesce(sum(amount), 0) as amount from " + TRANSACTION_TABLE + " ";
//     query += "where date(startdate) = $1 ";
//     query += "and project_id = $2";

//     return client.query(query, [day, project_id]);
// };

// const getViolationsCount = (day, project_id) => {
//     let query = "select count (*) from " + CONTRAVENTION_TABLE + " ";
//     query += "where project_id = $2 ";
//     query += "and date_trunc('day', creation) = $1";

//     return client.query(query, [day, project_id]);
// };

// const getTransactionsCount = (day, project_id) => {
//     let query = "select count (*) from " + TRANSACTION_TABLE + " ";
//     query += "where project_id = $2 ";
//     query += "and date(startdate) = $1;";

//     return client.query(query, [day, project_id]);
// };

// const getCurrency = project_id => {
//     let query = "select currency from " + TRANSACTION_TABLE + " ";
//     query += "where project_id = $1 limit 1";

//     return client.query(query, [project_id]);
// };

// const getWorkingPND = (day, project_id) => {
//     // let query = "select count(*) from " + ASSET_TABLE + " ";
//     // query += "where project_id = $1 ";
//     // query += "and status = 'Installed' ";
//     // query += "and date(date_deployed) = $2 ";
//     // query += "and type_asset = 'PND'";
//     const query = `SELECT count(*) FROM ${ASSET_TABLE} asset
//     left join ${ASSET_MODEL_TABLE} model ON model.id=asset.model_id
//     left join ${ASSET_TYPE_TABLE} atypes ON atypes.id=model.type_id
//     where asset.project_id=$1 and asset.status='Installed'
//     and asset.deployed_at=$2 and atypes.name='PND'`;

//     return client.query(query, [project_id, day]);
// };

// const getPNDCount = project_id => {
//     // let query = "select count(*) from " + ASSET_TABLE + " ";
//     // query += "where project_id = $1 ";
//     // query += "and type_asset = 'PND'";
//     const query = `SELECT count(*) FROM ${ASSET_TABLE} asset
//     left join ${ASSET_MODEL_TABLE} model ON model.id=asset.model_id
//     left join ${ASSET_TYPE_TABLE} atypes ON atypes.id=model.type_id
//     where asset.project_id=$1 and atypes.name='PND'`;

//     return client.query(query, [project_id]);
// };

// const getAssetsByType = (day, project_id, type) => {
//     // let query = `select count(*) as count from ${ASSET_TABLE} `;
//     // query += ` where project_id = $2 `;
//     // query += ` and date(date_deployed) = $1`;
//     // query += ` and type_asset = $3`;

//     // let queryInstalled = query + ` and status = 'Installed'`;

//     const query = `SELECT count(*) FROM ${ASSET_TABLE} asset
//     left join ${ASSET_MODEL_TABLE} model ON model.id=asset.model_id
//     left join ${ASSET_TYPE_TABLE} atypes ON atypes.id=model.type_id
//     where asset.deployed_at=$1 and asset.project_id=$2 and atypes.name=$3`;

//     const queryInstalled = query + ` and asset.status = 'Installed'`;

//     const args = [day, project_id, type];
//     return Promise.all([
//         client.query(queryInstalled, args),
//         client.query(query, args)
//     ]).then(([installed, total]) => ({
//         working: installed.rows[0].count,
//         sum: total.rows[0].count
//     }));
// };

// exports.get = get;
