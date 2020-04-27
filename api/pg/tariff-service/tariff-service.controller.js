const model = require('./tariff-service.model');

const create = async (req, res, next) => {
    model.create(req.body).then(result => {
        return res.status(201).json({message: 'created.'});
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

const update = async (req, res, next) => {
    const id = req.params.id;
    if(id) {
        return model.getAll({id: id}).then(result => {
            if (result && result.rows && result.rows[0]) {
                return model.update(id, req.body).then(Updated => {
                    return res.status(202).json({message: 'updated.'});
                }, rejected => {
                    return res.status(400).json({message: rejected.detail});
                });
            } else return res.status(202).json({error: 'Invalid data.'});
        });
    }
};

const del = async (req, res, next) => {
  const id = req.params.id;
  if(id) {
      try {
          await model.delete(id);
          return res.status(200).json({message: 'deleted.'});
      } catch (err) {
        if (!err.statusCode) {
              err.statusCode = 500;
          }
          next(err);
      }
  } else {
      return res.status(202).json({message: 'Invalid data'});
  }
};


exports.create = create;
exports.getAll = getAll;
exports.update = update;
exports.del = del;