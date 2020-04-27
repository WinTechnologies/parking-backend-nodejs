const makeModel = require('./vehicle_make.model');

module.exports = {
    async create (req, res, next) {
        try {
            // model.create doesn't exist at the moment
            const result = await makeModel.create(req.body);
            return res.status(201).json({ message: 'created.' });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    async getAll (req, res, next) {
        try {
            // model.getAll doesn't exist at the moment
            const result = await makeModel.getAll(req.query);
            return res.status(200).json(result.rows);
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    async update(req, res, next) {
        try {
            const id = req.params.id;
            if (id) {
                // model.getAll doesn't exist at the moment
                const result = await makeModel.getAll({ id });
                if (result && result.rows && result.rows[0]) {
                    const updated = await makeModel.update(id, req.body);
                    return res.status(202).json({ message: 'updated.' });
                } else {
                    return res.status(202).json({ error: 'Invalid data.' });
                }
            }
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },

    async del(req, res, next) {
        try {
            const id = req.params.id;
            if (id) {
                // model.getAll doesn't exist at the moment
                const result = await makeModel.getAll({ segment_id: id });
                if (result && result.rows && result.rows[0]) {
                    const deleted = await makeModel.delete(id);
                    return res.status(202).json({ message: 'deleted.' });
                } else {
                    return res.status(202).json({ error: 'Invalid data.' });
                }
            }
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    },
};
