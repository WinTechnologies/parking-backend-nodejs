const sequelize  = require('../../sequelize-models').sequelize;
const Op = sequelize.Op;
const moment = require('moment');
const momentTimezone = require('moment-timezone');

const assetModel = require('../../sequelize-models').asset_2;
const assetTypeModel = require('../../sequelize-models').asset_type_2;
const assetModelModel = require('../../sequelize-models').asset_model_2;

const parkingModel = require('../../sequelize-models').parking;
const rmqSaleModel = require('../../sequelize-models').rmq_sale;

const currencySARCoef = 0.01;

const get = (req, res, next) => {
    getByQuery(req.query)
        .then(response => res.status(200).json(response))
        .catch(err => {
            return res.status(400).json({ message: err.message })
        });
};

const getByQuery = async (query) => {
    return Promise.all([
        getSpacesChartInfo(query),
        getTicketCount(query),
        getParkingMetersCount(query),
    ]).then(([paidOccupancyChartInfo, ticketCount, parkingMetersCount]) => {
        return ({
            ...paidOccupancyChartInfo,
            ...ticketCount,
            ...parkingMetersCount,
        })
    });
};

const getSpacesChartInfo = ({day, project_id}) => {
    return Promise.all([
        getSpacesOccupiedCount(day, project_id),
        getOccupiedTime(day),
        getSpacesCount(project_id), 
        getTicketCount({day, project_id})
    ]).then(([
        commonSpacesOccupied, 
        timeOccupied,
        spacesCount, 
        ticketCount]) => {
            return {
                spacesOccupied: commonSpacesOccupied,
                spacesAvailable: (spacesCount <= commonSpacesOccupied) ? 0 : spacesCount - commonSpacesOccupied,
                // occupancy: ((commonSpacesOccupied * 100) / spacesCount).toFixed(2),
                occupancy: ((+timeOccupied.dataValues.timeOccupied * 100 / (spacesCount * 24))).toFixed(2),
                spacesCount,
                revenue_spaces: {
                    value: (ticketCount.revenue.value / spacesCount).toFixed(2),
                    currency: ticketCount.revenue.currency
                }
            }
        })
};

const getSpacesOccupiedCount = async (day, project_id) => {
    const dayBeginning = moment(day).startOf('day').toDate();
    const dayEnd = moment(day).endOf('day').toDate();

    return rmqSaleModel.count({
        where: {
            [Op.and]: [
                sequelize.where(sequelize.col('products_startdate'), '<=', dayEnd),
                sequelize.where(sequelize.col('products_enddate'), '>=', dayBeginning),
            ]
        },
        include: [{ model: assetModel, as: 'asset_2', where: { project_id }, required:true }]
    });
};

const getOccupiedTime = async (day) => {
    const dayBeginning = momentTimezone(day).startOf('day').format('YYYY-MM-DD HH:mm:ss.SSSSSS');
    const dayEnd = momentTimezone(day).endOf('day').format('YYYY-MM-DD HH:mm:ss.SSSSSS');
    const query = `EXTRACT(EPOCH FROM (
        SELECT SUM(products_enddate - products_startdate)
        FROM rmq_sale
        WHERE (products_startdate, products_enddate) OVERLAPS ('${dayBeginning}', '${dayEnd}')))/3600`;
    return rmqSaleModel.findOne({
        attributes: [
               [sequelize.literal(`${query}`), 'timeOccupied']
        ]
    });
};

const getSpacesCount = project_id => {
    return parkingModel.sum('parking_spaces', {
        where: { project_id: project_id }
    });
};

const getTicketCount = async ({day, project_id}) => {
    const tickets = await rmqSaleModel.findAll({
        where: {
            [Op.and]: [
                { products_paidduration: { [Op.ne]: null } },
                sequelize.where(sequelize.fn('DATE', sequelize.col('sale_date')), day)
            ]
        },
        include: [{  model: assetModel, as: 'asset_2', where: { project_id }, required:true }]
    });

    const paidDurationSeconds = tickets
        .reduce((a, ticket) => a + ticket.products_paidduration, 0);

    const productAmountSum = tickets
        .reduce((a, ticket) => a + ticket.products_amount, 0);

    const paymentDetails = tickets
        .map(ticket => {
            let response = {};
            try {
                response = JSON.parse(ticket.payments_details);
                return response;
            } catch (e) {
                return response;
            }
        });
    const currency = tickets.length ? tickets[0].currency : '';
    const paidDurationHours = paidDurationSeconds / 3600;
    const ticketsSoldCount = tickets.length;
    const transactionCount = {};
    const payment = {};
    const revenue = (productAmountSum * currencySARCoef);
    let commonTransactionCount = 0;

    paymentDetails.forEach((paymentDetail) => {
        const paymentMethods = Object.keys(paymentDetail);
        if (paymentMethods.length > 1 && paymentMethods.indexOf('NOTES') > -1) {
            paymentMethods.forEach(paymentMethod => {
                if (!transactionCount['NOTES']) {
                    transactionCount['NOTES'] = 0;
                }
    
                transactionCount['NOTES'] += paymentDetail[paymentMethod].length;
                commonTransactionCount += paymentDetail[paymentMethod].length;
            });
        } else {
            paymentMethods.forEach(paymentMethod => {
                if (!transactionCount[paymentMethod]) {
                    if (paymentMethod !== 'CARDS') {
                        transactionCount[paymentMethod] = 0;
                    } else {
                        transactionCount[paymentMethod] = {};
                        // IN CASE card_wording VALUE === undefined
                        transactionCount[paymentMethod]['CARD'] = 0;
                        if (!transactionCount[paymentMethod][paymentDetail[paymentMethod][0]['card_wording']] && 
                                paymentDetail[paymentMethod][0]['card_wording']) {
                            transactionCount[paymentMethod][paymentDetail[paymentMethod][0]['card_wording']] = 0;
                        }
                    }
                } 
                if (paymentMethod === 'CARDS') {
                    if (paymentDetail[paymentMethod][0]['card_wording']) {
                        transactionCount[paymentMethod][paymentDetail[paymentMethod][0]['card_wording']] += paymentDetail[paymentMethod].length;
                        commonTransactionCount += paymentDetail[paymentMethod].length;
                    } else {
                        transactionCount[paymentMethod]['CARD'] += paymentDetail[paymentMethod].length;
                        commonTransactionCount += paymentDetail[paymentMethod].length;
                    }
                } else {
                    transactionCount[paymentMethod] += paymentDetail[paymentMethod].length;
                    commonTransactionCount += paymentDetail[paymentMethod].length;
                }
            });
        }
    });

    Object.keys(transactionCount).forEach((paymentMethod, i, keys) => {
        if (paymentMethod === 'CARDS') {
            if (keys.length === 1) {
                Object.keys(transactionCount[paymentMethod]).forEach((cardWording) => {
                    payment[cardWording] = ((transactionCount[paymentMethod][cardWording] * 100) / commonTransactionCount).toFixed(2);
                });
            } else {
                payment[paymentMethod] = Object.keys(transactionCount[paymentMethod]).reduce((result, cardWording) => {
                    const percent = +((transactionCount[paymentMethod][cardWording] * 100) / commonTransactionCount).toFixed(2);
                    result += percent;
                    return result;
                }, 0).toFixed(2);
            }
        } else {
            payment[paymentMethod] = ((transactionCount[paymentMethod] * 100) / commonTransactionCount).toFixed(2);
        }
    });
    
    return {
        payment,
        revenue: {
            value: revenue,
            currency
        },
        als: ticketsSoldCount > 0 ? (paidDurationHours / ticketsSoldCount).toFixed(1) : 0,
        atv: {
            value: ticketsSoldCount > 0 ? (revenue / ticketsSoldCount).toFixed(2) : 0,
            currency
        }
    }
};

const getParkingMetersCount = ({project_id}) => {
    return Promise.all([getWorkingParkingMetersCount(project_id), getCommonParkingMetersCount(project_id)])
      .then(([working, common]) => {
          return {
              working_pnd: working,
              total_pnd: common
          }
      })
};

const getCommonParkingMetersCount = project_id => {
    return assetModel.count({
        where: { project_id: project_id },
        include: [{
            model: assetModelModel, as: 'model',
            include:[{
                model: assetTypeModel, as: 'type',
                where: {
                    name: 'Parking Meter'
                },
                required:true
            }]
        }]
    });
};

const getWorkingParkingMetersCount = project_id => {
    return assetModel.count({
        where: { project_id: project_id, status: 'Installed' },
        include: [{
            model: assetModelModel, as: 'model',
            include:[{
                model: assetTypeModel, as: 'type',
                where: {
                    name: 'Parking Meter'
                },
                required:true
            }]
        }]
    });
};

exports.get = get;
exports.getByQuery = getByQuery;
