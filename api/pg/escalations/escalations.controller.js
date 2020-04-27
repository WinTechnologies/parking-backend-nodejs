const model = require('./escalations.model');

const create = async (req, res, next) => {
    model.create(req.body, req._user.employee_id).then(result => {
        return res.status(201).json({message: 'created.', new: result.rows});
    }).catch(err => {
        return res.status(400).json({message: err.message});
    });
};

const getAll = (req, res, next) => {
    model.getAll(req.query).then(result => {
        return res.status(200).json(result.rows);
    }).catch(err => {
        next(err);
    });
};

const update = async (req, res, next) => {
    const id = req.params.id;
    model.update(id, req.body).then(() => {
        return res.status(202).json({ message: 'updated.' });
    }).catch(err => {
        return res.status(500).json({ message: err.message });
    });
};

const del = async (req, res, next) => {
    const id = req.params.id;
    try {
        const result = await model.getAll({id: id});
        if (result && result.rows && result.rows[0]) {
            const deleted_by = req._user.employee_id;
            await model.delete(id, deleted_by);
            return res.status(202).json({message: 'deleted.'});
        } else {
            return res.status(400).json({error: 'Invalid data.'});
        }
    } catch (e) {
        return res.status(400).json({error: e.message});            
    }
};


exports.create = create;
exports.getAll = getAll;
exports.update = update;
exports.del = del;
