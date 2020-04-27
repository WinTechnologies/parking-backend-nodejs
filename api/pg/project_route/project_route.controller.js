const model = require('./project_route.model');

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
        return res.status(400).json({message: err.message});
    });
};

const getOne = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await model.getAll({id});
    if (result.rows.length === 0) {
      const error = new Error('This Route doesn\'t exist');
      error.statusCode = 404;
      throw error;
    }
    const route = result.rows[0];
    const staffsResult = await model.getStaffsById(id);
    route.staffs = staffsResult.rows;
    return res.status(200).json(route);
  } catch (err) {
    return res.status(400).json({message: err.message});
  }
};

const update = async (req, res, next) => {
    const id = req.params.id;
    if(id) {
        return model.getAll({id: id}).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.update(id, req.body).then(Updated => {
                    return res.status(202).json({message: 'updated.'});
                });
            } else return res.status(404).json({message: 'Invalid data.'});
        });
    }
};

const del = async (req, res, next) => {
    const id = req.params.id;
    if(id) {
        return model.getAll({id: id}).then(result => {
            if (result && result.rows && result.rows[0]) {
            return model.delete(id, req._user.employee_id).then(deleted => {
                return res.status(202).json({message: 'deleted.'});
        });
        } else return res.status(202).json({error: 'Invalid data.'});
    });
    }
};


exports.create = create;
exports.getAll = getAll;
exports.getOne = getOne;
exports.update = update;
exports.del = del;
