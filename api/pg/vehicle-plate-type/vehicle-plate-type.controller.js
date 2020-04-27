const vehiclePlateTypeModel = require('../sequelize-models').vehicle_plate_type;

const getAll = async (req, res, next) => {
    try {
        const results = await vehiclePlateTypeModel.findAll({
            where: {
                is_active: true
            },
        });
        return res.status(200).send(results);
    } catch (err) {
        next(err);
    }
};

const getIssuedCountries = async (req, res, next) => {
    try {
        const results = await vehiclePlateTypeModel.aggregate('issue_authority', 'DISTINCT', { plain: false });
        return res.status(200).send(results.map(element => element.DISTINCT));
    } catch (err) {
        next(err);
    }
};

exports.getAll = getAll;
exports.getIssuedCountries = getIssuedCountries;