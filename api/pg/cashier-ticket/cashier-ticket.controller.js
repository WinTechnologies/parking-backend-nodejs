const model = require('./cashier-ticket.model');

const get = async (req, res, next) => {
    try {
        const result = await model.getUnpaidTicket(req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

// TODO: Carpark Cashier Ticket; MAPS frontend doesn't consume this endpoint,
//  so Need to check its request body with mobile team
//  POST /api/pg/cashier-ticket
const create = async (req, res, next) => {
    try {
        const result = await model.createTicket(req.body);
        return res.status(200).json({ message: 'success' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.get = get;
exports.create = create;
