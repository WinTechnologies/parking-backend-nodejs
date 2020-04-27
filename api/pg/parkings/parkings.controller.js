const model = require('./parkings.model');

const create = async (req, res, next) => {
    model.create(req.body).then(result => {
        return res.status(201).json({ message: 'created.' });
    }).catch(err => {
        return res.status(400).json({ message: err.message });
    });
};

const getAll = (req, res, next) => {
    model.getAll(req.query).then(result => {
        return res.status(200).json(result.rows);
    }).catch(err => {
        return res.status(400).json({ message: err.message });
    });
};

const getAllWithDetails = (req, res, next) => {
    model.getAllWithDetails(req.query).then(result => {
        return res.status(200).json(result.rows);
    }).catch(err => {
        return res.status(400).json({ message: err.message });
    });
};

const getAllWithZones = (req, res, next) => {
    model.getAllWithZones(req.query).then(result => {
        return res.status(200).json(result.rows);
    }).catch(err => {
        return res.status(400).json({ message: err.message });
    });
};

const update = async (req, res, next) => {
    const id = req.params.id;
    if (id) {
        return model.getAll({ id: id }).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.update(id, req.body).then(Updated => {
                    return res.status(202).json({ message: 'updated.' });
                });
            } else return res.status(202).json({ error: 'Invalid data.' });
        });
    }
};

const del = async (req, res, next) => {
    const id = req.params.id;
    if (id) {
        return model.getAll({ id: id }).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.delete(id).then(deleted => {
                    return res.status(202).json({ message: 'deleted.' });
                });
            } else return res.status(202).json({ error: 'Invalid data.' });
        });
    }
};

const getNumber = (req, res, next) => {
    model.getNumber(req.query).then(result => {
        return res.status(200).json(result);
    }).catch(err => {
        return res.status(400).json({ message: err.message });
    });
};

const getParkingCode = (req, res, next) => {
    model.getParkingCode(req.query).then(result => {
        return res.status(200).json(result);
    }).catch(err => {
        return res.status(400).json({ message: err.message });
    });
};

const getPaymentMethods = (req, res, next) => {
    model.getPaymentMethods().then(result => {
        return res.status(200).json(result.rows);
    }).catch(err => {
        return res.status(400).json({ message: err.message });
    });
};

exports.create = create;
exports.getAll = getAll;
exports.getAllWithDetails = getAllWithDetails;
exports.update = update;
exports.del = del;
exports.getNumber = getNumber;
exports.getParkingCode = getParkingCode;
exports.getPaymentMethods = getPaymentMethods;
exports.getAllWithZones = getAllWithZones;
