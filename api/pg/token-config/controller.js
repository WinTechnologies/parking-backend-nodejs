const tokenModel = require('../sequelize-models').list_token;

const getAllTokens = async () => {
    return await tokenModel.findAll({ raw: true });
};

const getAll = async (req, res, next) => {
  try {
      const result = await getAllTokens();
      return res.status(200).send(result);
  } catch (err) {
    if (!err.statusCode) {
        err.statusCode = 500;
    }
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
      const {
          token_name, lifetime, unit
      } = req.body;

      const employee = req._user;
      const tokenBody = {
          token_name,
          lifetime,
          unit,
          created_by: employee.employee_id,
          created_at: new Date(),
      };

      const result = await tokenModel.create(tokenBody);
      return res.status(201).json({ message: 'created.', id: result.id });
  } catch (err) {
      if (!err.statusCode) {
          err.statusCode = 500;
      }
      next(err);
  }
};


const update = async (req, res, next) => {
  try {
      const token_name = req.params.token_name;
      if (id) {
          return tokenModel.getAll({token_name: token_name})
              .then(result => {
                  if (result && result.rows && result.rows[0]) {
                      return tokenModel.update(id, req.body)
                          .then(res => {
                              return res.status(202).json({message: 'Updated.'});
                          });
                  } else {
                      throw new Error('Invalid data.');
                  }
              });
      }
  } catch (err) {
      if (!err.statusCode) {
          err.statusCode = 500;
      }
      next(err);
  }
};

exports.getAllTokens = getAllTokens;
exports.getAll = getAll;
exports.create = create;
exports.update = update;
