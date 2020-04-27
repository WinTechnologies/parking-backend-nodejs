const listJobActionModel = require('./../sequelize-models').list_job_action;

const create = async (req, res, next) => {
    try {
        const {
            code, description, is_active, created_by
        } = req.body;
        const jobActionBody = {
            code, description, is_active, created_by
        };

        const result = await listJobActionModel.create(jobActionBody);
        return res.status(201).json({ message: 'Created.', code: result.code });
    } catch (err) {
        next(err);
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await listJobActionModel.findAll();
        return res.status(200).send(result);
    } catch (err) {
        next(err);
    }
};

const getByCode = async (req, res, next) => {
    try {
        const jobActionByCode = await listJobActionModel.findOne({
            where: {
                code: req.params.code,
                is_active: true
            }
        });
        if (jobActionByCode) {
            return res.status(200).json(jobActionByCode);
        } else {
            return res.status(404).json({ message: 'No job action found by code.' });
        }
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const code = req.params.code;
        const jobActionUpdate = await listJobActionModel
            .findOne({
                where: {
                    code: code,
                }
            });
        if (!jobActionUpdate) {
            return res.status(404).json({ message: 'Job action not found!' });
        }

        const {
            description, is_active, created_by
        } = req.body;

        const updateBody = {
            description, is_active, created_by
        };

        await jobActionUpdate.update(updateBody);
        return res.status(202).json({ message: 'Updated.' });
    } catch (err) {
        next(err);
    }
};

// RESTful apis
exports.create = create;
exports.getAll = getAll;
exports.getByCode = getByCode;
exports.update = update;
