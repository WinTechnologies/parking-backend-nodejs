const listJobCancellationReasonModel = require('./../sequelize-models').list_job_cancellation_reason;

const create = async (req, res, next) => {
    try {
        const {
            code, name_en, name_ar, job_action_code, description, is_active, created_by
        } = req.body;
        const cancelReasonBody = {
            code, name_en, name_ar, job_action_code, description, is_active, created_by
        };
        const result = await listJobCancellationReasonModel.create(cancelReasonBody);
        return res.status(201).json({ message: 'Created.', code: result.code });
    } catch (err) {
        next(err);
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await listJobCancellationReasonModel.findAll();
        return res.status(200).send(result);
    } catch (err) {
        next(err);
    }
};

const getByCode = async (req, res, next) => {
    try {
        const cancelReasonByCode = await listJobCancellationReasonModel.findOne({
            where: {
                code: req.params.code,
                is_active: true
            }
        });
        if (cancelReasonByCode) {
            return res.status(200).json(cancelReasonByCode);
        } else {
            return res.status(404).json({message: 'No job cancellation reason found by code.'});
        }
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const code = req.params.code;
        const cancelReasonUpdate = await listJobCancellationReasonModel
            .findOne({
                where: {
                    code: code,
                }
            });
        if (!cancelReasonUpdate) {
            return res.status(404).json({ message: 'Job cancallation reason not found!' });
        }

        const {
            name_en, name_ar, job_action_code, description, is_active, created_by
        } = req.body;

        const updateBody = {
            name_en, name_ar, job_action_code, description, is_active, created_by
        };

        await jobActionUpdate.update(updateBody);
        return res.status(202).json({ message: 'Updated.' });
    } catch (err) {
        next(err);
    }
};


const getByJobActionCode = async (req, res, next) => {
    try {
        const cancelReasonByJobActionCode = await listJobCancellationReasonModel.findAll({
            where: {
                job_action_code: req.params.job_action_code,
                is_active: true
            }
        });
        if (cancelReasonByJobActionCode) {
            return res.status(200).json(cancelReasonByJobActionCode);
        } else {
            return res.status(404).json({ message: 'No job cancellation reason found by job_action_code.' });
        }
    } catch (err) {
        next(err);
    }
};

// RESTful apis
exports.create = create;
exports.getAll = getAll;
exports.getByCode = getByCode;
exports.update = update;
exports.getByJobActionCode = getByJobActionCode;
