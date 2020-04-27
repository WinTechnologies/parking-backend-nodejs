const vehicleModel = require('./vehicle.model');

module.exports = {
    async getAllColors(req, res, next) {
        try {
            const result = await vehicleModel.getColors(req.query);
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    async getAllMakes(req, res, next) {
        try {
            const result = await vehicleModel.getMakes(req.query);
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    async getAllModels(req, res, next) {
        try {
            const result = await vehicleModel.getModels(req.query);
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    async getAllTypes(req, res, next) {
        try {
            const result = await vehicleModel.getTypes(req.query);
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    async getAllPlateTypes(req, res, next) {
        try {
            const result = await vehicleModel.getPlateTypes(req.query);
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

};
