const listDefectModel = require('../sequelize-models').list_defect;

const create = async (req, res, next) => {
    try {
        const {
            name_en, name_ar, description, created_by, deleted_by
        } = req.body;

        const listDefectBody = {
            name_en, name_ar, description, created_by, deleted_by
        };

        const result = await listDefectModel.create(listDefectBody);
        return res.status(201).json({ message: 'Created.', id: result.id });
    } catch (err) {
        next(err);
    }
};

const getAll = async (req, res, next) => {
    try {
        const result = await listDefectModel.findAll({
            where: {
                deleted_by: null,
                deleted_at: null
            }
        });
        return res.status(200).send(result);
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const listDefectById = await listDefectModel.findOne({
            where: {
                id: req.params.id,
                deleted_by: null,
                deleted_at: null
            }
        });
        if (listDefectById) {
            return res.status(200).json(listDefectById);
        } else {
            return res.status(404).json({ message: `No defect was found for this id: ${req.params.id}.` });
        }
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const listDefectUpdate = await listDefectModel
            .findOne({
                where: {
                    id: id,
                }
            });
        if (!listDefectUpdate) {
            return res.status(404).json({ message: 'List Defect not found!' });
        }

        const {
            name_en, name_ar, description, created_by, deleted_by
        } = req.body;

        const updateBody = {
            name_en, name_ar, description, created_by, deleted_by
        };

        await listDefectUpdate.update(updateBody);
        return res.status(200).json({ message: 'Updated.' });
    } catch (err) {
        next(err);
    }
};

exports.create = create;
exports.getAll = getAll;
exports.getById = getById;
exports.update = update;
