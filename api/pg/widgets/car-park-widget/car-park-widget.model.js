// const client = require('../../../../helpers/postgresClient');

// const ASSET_TABLE = "asset_2"; // "asset";
// const ASSET_MODEL_TABLE = "asset_model_2";
// const ASSET_TYPE_TABLE = "asset_type_2";
// const CASHIER_TICKET_TABLE = "cashier_ticket_2";
// const CASHIER_EXIT_TABLE = "cashier_exit_2";

// const get = async ({ day, project_id }) => {
//     return Promise.all([
//         /*getAssetsAndInstalled(day, project_id),
//         getRevenueChartInfo(day, project_id),
//         getRevenueChartPerSpaceInfo(day, project_id),
//         getPaymentModeChartInfo(day, project_id),
//         getALS(day, project_id),
//         getATV(day, project_id),*/
//     ]).then(([assetsAndInstalled, Revenue, RevenuePerSpace, PaymentMode, ALS, ATV]) => ({
//         ...assetsAndInstalled,
//         ...Revenue,
//         ...RevenuePerSpace,
//         ...PaymentMode,
//         ...ALS,
//         ...ATV,
//     }));
// };

// const getAssetsAndInstalled = (day, project_id) => {
//     const asset_types = ['APM', 'Barrier', 'TDispenser', 'TVerifier'];
//     return Promise.all(asset_types.map(type => getAssetsAndInstalledByType(day, project_id, type)))
//         .then(([APM,  Barrier, TDispenser, TVerifier]) => ({
//             APM,  Barrier, TDispenser, TVerifier
//         }));
// };

// const getAssetsAndInstalledByType = (day, project_id, type) => {
//     return Promise.all([
//         getInstalledAssetsByType(day, project_id, type),
//         getAssetsByType(day, project_id, type)
//     ]).then(([installed, total]) => (installed.rows[0].count + '/' + total.rows[0].count));
// };

// const getPaymentModeChartInfo = (day, project_id) => {
//     return getPaymentMode(day, project_id).then((paymentModeResult) => {
//         const Payment = {};
//         const paymentModeCounter = {};
//         const count = paymentModeResult.rows.length;

//         paymentModeResult.rows.forEach((row) => {
//             if (row.paid_mode && !paymentModeCounter[row.paid_mode]) {
//                 paymentModeCounter[row.paid_mode] = 0;
//             }
//             paymentModeCounter[row.paid_mode] += 1;
//         });

//         Object.keys(paymentModeCounter).forEach((paymentMode) => {
//             Payment[paymentMode] = ((paymentModeCounter[paymentMode] * 100) / count);
//         });

//         return {Payment};
//     });
// };

// const getRevenueChartInfo = (day, project_id) => {
//     return getRevenue(day, project_id).then((revenueTotal) => {
//         const result = revenueTotal.rows[0].revenue || 0;
//         return { Revenue: parseFloat(result).toFixed(2) };
//     });
// };

// const getRevenueChartPerSpaceInfo = (day, project_id) => {
//     return getRevenue(day, project_id).then((revenueTotal) => {
//         const result = revenueTotal.rows[0].revenue || 0;
//         return { RevenuePerSpace: parseFloat(result).toFixed(2) };
//     });
// };

// const getALS = (day, project_id) => {
//     return Promise.all([getStayHours(day, project_id), getTicketCount(day, project_id)])
//         .then(([stayHours, ticketCount]) => {
//             let result = 0;

//             if (ticketCount.rows[0].count !== '0' && stayHours.rows[0].stayhours !== null) {
//                 result = (stayHours.rows[0].stayhours / ticketCount.rows[0].count).toFixed(2)
//             }
//             return {
//                 ALS: result
//             };
//         });
// };

// const getATV = (day, project_id) => {
//     return Promise.all([getTotalPrice(day, project_id), getTicketCount(day, project_id)])
//         .then(([revenuePrice, ticketCount]) => {
//             let result = {
//                 currency: '',
//                 revenue: 0
//             };

//             if (ticketCount.rows[0].count !== '0') {
//                 let totalPrice = 0;
//                 revenuePrice.rows.forEach((row) => {
//                     try {
//                         const detailTariffs = JSON.parse(row.detail_tariffs);
//                         result.currency = detailTariffs.currency;
//                         totalPrice += +detailTariffs.totalPrice;
//                     } catch (e) {
//                     }
//                 });
//                 result.revenue = (totalPrice / parseInt(ticketCount.rows[0].count)).toFixed(2);
//             }
//             return {
//                 ATV: result
//             };
//         });
// };

// const getTotalPrice = (day, project_id) => {
//     let query = `SELECT * FROM ${CASHIER_EXIT_TABLE} t
//     LEFT JOIN ${CASHIER_TICKET_TABLE} t2 ON t2.ticket_number = t.ticket_number
//     WHERE t.operation_type = 'Carpark' AND date(t.issued_at) = $1 AND t.project_id = $2 AND t2.detail_tariffs IS NOT NULL`;
//     const args = [day, project_id];

//     return client.query(query, args);
// };

// const getRevenue = (day, project_id) => {
//     let query = `SELECT SUM(t.amount_total) as revenue FROM ${CASHIER_TICKET_TABLE} t
//     LEFT JOIN ${CASHIER_EXIT_TABLE} t2 ON t2.ticket_number = t.ticket_number
//     WHERE t2.operation_type = 'Carpark' AND date(t2.issued_at) = $1 AND t2.project_id = $2`;
//     const args = [day, project_id];

//     return client.query(query, args);
// };

// const getPaymentMode = (day, project_id) => {
//     let query = `SELECT * FROM ${CASHIER_EXIT_TABLE} t
//     LEFT JOIN ${CASHIER_TICKET_TABLE} t2 ON t2.ticket_number = t.ticket_number
//     WHERE t.operation_type = 'Carpark' AND date(t.issued_at) = $1 AND t.project_id = $2 AND t2.paid_mode IS NOT NULL`;
//     const args = [day, project_id];

//     return client.query(query, args);
// };

// const getStayHours = (day, project_id) => {
//     let query = `SELECT SUM((EXTRACT(EPOCH FROM t.date_out) - EXTRACT(EPOCH FROM t.date_in))/3600) as stayHours FROM ${CASHIER_EXIT_TABLE} t
//     LEFT JOIN ${CASHIER_TICKET_TABLE} t2 ON t2.ticket_number = t.ticket_number
//     WHERE t.operation_type = 'Carpark' AND date(t.issued_at) = $1 AND t.project_id = $2`;
//     const args = [day, project_id];

//     return client.query(query, args);
// };

// const getTicketCount = (day, project_id) => {
//     let query = `SELECT COUNT(*) as count FROM ${CASHIER_EXIT_TABLE} t
//     LEFT JOIN ${CASHIER_TICKET_TABLE} t2 ON t2.ticket_number = t.ticket_number
//     WHERE t.operation_type = 'Carpark' AND date(t.issued_at) = $1 AND t.project_id = $2`;
//     const args = [day, project_id];

//     return client.query(query, args);
// };

// const getAssetsByType = (day, project_id, type) => {
//     // let query = `select count(*) as count from ${ASSET_TABLE} `;
//     // query += ` where project_id = $2 and date(date_deployed) = $1`;
//     // query += ` and type_asset = $3`;
//     const query = `SELECT count(*) FROM ${ASSET_TABLE} asset
//     left join ${ASSET_MODEL_TABLE} model ON model.id=asset.model_id
//     left join ${ASSET_TYPE_TABLE} atypes ON atypes.id=model.type_id
//     where SUBSTRING(to_char(asset.deployed_at, 'YYYY-MM-DD') FROM 1 FOR 10)=$1 and asset.project_id=$2 and atypes.name=$3`;
//     const args = [day, project_id, type];

//     return client.query(query, args);
// };

// const getInstalledAssetsByType = (day, project_id, type) => {
//     // let query = `select count(*) as count from ${ASSET_TABLE} `;
//     // query += ` where project_id = $2 and date(date_deployed) = $1`;
//     // query += ` and type_asset = $3`;
//     // query += ` and status =  'Installed'`;
//     const query = `SELECT count(*) FROM ${ASSET_TABLE} asset
//     left join ${ASSET_MODEL_TABLE} model ON model.id=asset.model_id
//     left join ${ASSET_TYPE_TABLE} atypes ON atypes.id=model.type_id
//     where SUBSTRING(to_char(asset.deployed_at, 'YYYY-MM-DD') FROM 1 FOR 10)=$1 and asset.project_id=$2 and atypes.name=$3 and asset.status='Installed'`;
//     const args = [day, project_id, type];

//     return client.query(query, args);
// };


// exports.get = get;
