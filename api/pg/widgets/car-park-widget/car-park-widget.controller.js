const sequelize  = require('../../sequelize-models').sequelize;
const Op = sequelize.Op;
const moment = require('moment');
const cashierExitModel = require('../../sequelize-models').cashier_exit;
const cashierTicketModel = require('../../sequelize-models').cashier_ticket;
const assetModel = require('../../sequelize-models').asset_2;
const assetModelModel = require('../../sequelize-models').asset_model_2;
const assetTypeModel = require('../../sequelize-models').asset_type_2;

const get = (req, res, next) => {
    getByQuery(req.query)
        .then(response => res.status(200).json(response))
        .catch(err => {
            return res.status(400).json({ message: err.message })
        });
};

const getByQuery = async (query) => {
    return Promise.all([
        getATVTotal(query),
        getATV(query),
        getALS(query),
        getPaymentModeChartInfo(query),
        getRevenue(query),
        getAssetsAndInstalled(query),
    ]).then(([ATV, ATVTotal, ALS, PaymentMode, Revenue, AssetsAndInstalled]) => ({
        ...ATV,
        ...ATVTotal,
        ...ALS,
        ...PaymentMode,
        ...Revenue,
        ...AssetsAndInstalled,
        occupancy: '0.00'
    }));
};

const getATV = async (query) => {
    const ticketCount = await getTicketCount(query) || 1;
    const conditions = getCommonConditions(query);
    conditions.include[0].where = { detail_tariffs: { [Op.ne]: null } };
    const tickets = await cashierExitModel.findAll(conditions);
    let result = { currency: 'SAR', amount: 0, total: 0 };
    tickets.forEach((ticket) => {
        const detailTariffs = JSON.parse(ticket.cashier_ticket.detail_tariffs);
        result.currency = detailTariffs.currency;
        result.total += +detailTariffs.totalPrice;
    });
    result.amount = (result.total / ticketCount).toFixed(2);
    return {
        ATV: result
    };
};

const getATVTotal = async (query) => {
    const ticketCount = await getTicketCount(query) || 1;
    const tickets = await getTickets(query);
    const amountDue = tickets
        .reduce((a, ticket) => a + (ticket.cashier_ticket.amount_due ? parseFloat(ticket.cashier_ticket.amount_due) : 0), 0);
        // .map((ticket) => ticket.cashier_ticket.amount_due ? parseFloat(ticket.cashier_ticket.amount_due) : 0)
        // .reduce((a, b) => a + b, 0);

    return {
        ATVTotal: (amountDue / ticketCount).toFixed(2)
    };
};

const getALS = async (query) => {
    const ticketCount = await getTicketCount(query) || 1;
    const tickets = await getTickets(query);
    const hourSum = tickets
        .reduce((a, ticket) => a + (ticket.date_out && ticket.date_in ? moment.duration(moment(ticket.date_out).diff(ticket.date_in)).asHours() : 0), 0);
        // .map((ticket) => ticket.date_out && ticket.date_in ? moment.duration(moment(ticket.date_out).diff(ticket.date_in)).asHours() : 0)
        // .reduce((a, b) => a + b, 0);

    return {
        ALS: (hourSum / ticketCount).toFixed(2)
    };
};

const getRevenue = async (query) => {
    const tickets = await getTickets(query);
    const revenue = tickets
        .reduce((a, ticket) => a + (ticket.cashier_ticket.amount_total ? parseFloat(ticket.cashier_ticket.amount_total) : 0), 0);
        // .map((ticket) => ticket.cashier_ticket.amount_total ? parseFloat(ticket.cashier_ticket.amount_total) : 0)
        // .reduce((a, b) => a + b, 0);

    return {
        Revenue: revenue.toFixed(2)
    };
};

const getPaymentModeChartInfo = async (query) => {
    const conditions = getCommonConditions(query);
    conditions.include[0].where = { paid_mode: { [Op.ne]: null } };
    const tickets = await cashierExitModel.findAll(conditions);

    const Payment = {};
    const paymentModeCounter = {};
    const count = tickets.length;

    tickets.forEach((ticket) => {
        if (ticket.cashier_ticket.paid_mode && !paymentModeCounter[ticket.cashier_ticket.paid_mode]) {
            paymentModeCounter[ticket.cashier_ticket.paid_mode] = 0;
        }
        paymentModeCounter[ticket.cashier_ticket.paid_mode] += 1;
    });

    Object.keys(paymentModeCounter).forEach((paymentMode) => {
        Payment[paymentMode] = ((paymentModeCounter[paymentMode] * 100) / count);
    });

    return {Payment};
};

const getTicketCount = (query) => {
    return cashierExitModel.count(getCommonConditions(query));
};

const getTickets = (query) => {
    return cashierExitModel.findAll(getCommonConditions(query));
};

const getAssetsAndInstalled = async ({day, project_id}) => {
    const assetTypes = ['APM', 'Barrier', 'TDispenser', 'TVerifier'];
    return Promise.all(assetTypes.map(type => getAssetsAndInstalledByType(day, project_id, type)))
        .then(([APM,  Barrier, TDispenser, TVerifier]) => ({
            APM,  Barrier, TDispenser, TVerifier
        }));
};

const getAssetsAndInstalledByType = async (day, project_id, type) => {
    const installed = await getInstalledAssetsByType(day, project_id, type);
    const total = await getAssetsByType(day, project_id, type);
    return `${installed}/${total}`;
};

const getAssetsByType = (day, project_id, type) => {
    return assetModel.count(getAssetConditions(day, project_id, type));
};

const getInstalledAssetsByType = (day, project_id, type) => {
    return assetModel.count(getAssetConditions(day, project_id, type, 'Installed'));
};

const getCommonConditions = ({day, project_id}) => {
    return {
        where: {
            [Op.and]: [
                { operation_type: 'Carpark', project_id: project_id },
                sequelize.where(sequelize.fn('DATE', sequelize.col('cashier_exit.issued_at')), day)
            ]
        },
        include: [{  model: cashierTicketModel, as: 'cashier_ticket' }],
    }
};

const getAssetConditions = (day, project_id, type, status = null) => {
    const whereConditions = {project_id: project_id};
    if (status) {
        whereConditions.status = status;
    }

    return {
        where: {
            [Op.and]: [
                whereConditions,
                sequelize.where(sequelize.fn('to_char', sequelize.col('asset_2.deployed_at'), 'YYYY-MM-DD'), day)
            ]
        },
        include: [{
            model: assetModelModel, as: 'model',
            include: [{
                model: assetTypeModel, as: 'type',
                where: { code: type }
            }]
        }]
    }
};

exports.get = get;
exports.getByQuery = getByQuery;
