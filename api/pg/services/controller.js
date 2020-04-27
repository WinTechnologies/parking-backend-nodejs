const serviceModel = require("./model");
const sequelizedService = require('../sequelize-models').service;

const getServices = async (req, res, next) => {
    try {
        const result = serviceModel.getServices(req.params);
        return res.status(200).json(result.rows);
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
  try {
      const {  service_name_en, service_name_ar, fee, img_url, working_days, working_timeslot, description,
                term_condition, created_at, operation_type, fee_unit, fee_max, fee_max_unit, project_id, payment_type_code, code } = req.body;

      const employee = req._user;

      const serviceBody = {
          service_name_en, service_name_ar, fee, img_url, working_days, working_timeslot, description,
          term_condition, created_at, operation_type, fee_unit, fee_max, fee_max_unit, project_id, payment_type_code, code,
          created_by: employee.employee_id,
          created_at: new Date(),
      };

      const result = await sequelizedService.create(serviceBody);
      return res.status(201).json({ message: 'created.', id: result.id });
  } catch (err) {
      if (!err.statusCode) {
          err.statusCode = 500;
      }
      next(err);
  }
};

exports.getServices = getServices;
exports.create = create;
