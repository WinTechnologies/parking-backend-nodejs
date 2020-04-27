const model = require('./permission-types.model');

const getAll = async (req, res, next) => {
    try {
        const result = await  model.getAll(req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getAll = getAll;
