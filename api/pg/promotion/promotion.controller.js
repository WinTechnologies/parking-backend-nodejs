const model = require('./promotion.model');
const promotionParkingModel = require('./promotion-parking.model');

const create = async (req, res, next) => {
    try {
        const response = await model.create({...req.body});
        const responseParking = await promotionParkingModel.createParkingsByPromotion(req.body.selectedParkings, response.rows[0].id);
        return res.status(201).json({
            message: 'Promotion created successfully'
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await  model.getAll(req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const getOne = async (req, res, next) => {
    try {
        const id = +req.params.id;
        const response = await model.getOne(id);
        if (response.rows.length === 0) {
            return res.status(404).json({ message: 'This Promotion doesn\'t exist' });
        }
        const promotionParkings = await promotionParkingModel.getParkingsByPromotion(id);
        const promotion = {...response.rows[0], promotionParkings: promotionParkings.rows};
        return res.status(200).json(promotion);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};


const update = async (req, res, next) => {
    try {
        const id = +req.params.id;
        const responseGet = await model.getOne(id);
        if (responseGet.rows.length === 0) {
            return res.status(404).json({ message: 'This Promotion doesn\'t exist' });
        }

        await promotionParkingModel.delParkingsByPromotion(id);
        await promotionParkingModel.createParkingsByPromotion(req.body.selectedParkings, id);
        const responseUpdate = await model.update(id, {...req.body});
        return res.status(200).json({
            message: 'Promotion updated'
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const del = async (req, res, next) => {
    try {
        const id = +req.params.id;
        const responseGet = await model.getOne(id);
        if (responseGet.rows.length === 0) {
            return res.status(404).json({ message: 'This Promotion doesn\'t exist' });
        }
        const responseParking = await promotionParkingModel.delParkingsByPromotion(id);
        const responseDelete = await model.delete(id);
        return res.status(200).json({
            message: 'Deleted Promotion'
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.create = create;
exports.getAll = getAll;
exports.getOne = getOne;
exports.update = update;
exports.del = del;
