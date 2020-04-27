const listEnforceStatusModel = require('../sequelize-models').list_enforcer_status;
const listTypeJobModel = require('../sequelize-models').list_type_job;

const create = async (req, res, next) => {
    try {
        const { name_en, name_ar, color, description, type_job_id } = req.body;
        const employee = req._user;

        const newBody = {
            name_en,
            name_ar,
            color,
            description,
            type_job_id,
            created_by: employee.employee_id,
            created_at: new Date()
        };

        const result = await listEnforceStatusModel.create(newBody);
        return res.status(200).json({ message: 'New Enforcer Status is created successfully.', id: result.id });
    } catch (err) {
        next(err);
    }
};

const getAllListEnforcerStatus = async (req, res, next) => {
    try {
        const result = await listEnforceStatusModel.findAll();
        return res.status(200).send(result);
    } catch (err) {
        next(err);
    }
};

const getEnforcerStatusByTypeJobId = async (req, res, next) => {
    try {
        const enforcerStatusByTypeJobId = await listEnforceStatusModel.findAll({
            where: {
                type_job_id: req.params.type_job_id,
                deleted_by: null,
                deleted_at: null
            },
            include : [
                { model: listTypeJobModel, as: 'type_job' }
            ]
        });
        if (enforcerStatusByTypeJobId) {
            return res.status(200).json(enforcerStatusByTypeJobId);
        } else {
            return res.status(404).json({ message: `No enforcer status was found with this job_type_id: ${req.params.job_type_id}.` });
        }
    } catch (err) {
        next(err);
    }
}

exports.create = create;
exports.getAllListEnforcerStatus = getAllListEnforcerStatus;
exports.getEnforcerStatusByTypeJobId = getEnforcerStatusByTypeJobId;

