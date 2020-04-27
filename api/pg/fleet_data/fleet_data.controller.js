const model = require('./fleet_data.model');

const get = async (req, res, next) => {
    try {
        const result = await model.get(req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.get = get;
