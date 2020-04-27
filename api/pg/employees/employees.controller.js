const model = require('./employees.model');
const modelProjectEmployee = require('../project_employee/project_employee.model');
const modelEmployeeWp = require('../employee-wp/employee_wp.model');
const permissionTemplateModel = require('./../admin/permission-templates/permission-templates.model');
const permissionTypeModel = require('./../admin/permission-types/permission-types.model');
const permissionFeatureModel = require('./../admin/permission-features/permission-features.model');
const employeePermissionModel = require('./../admin/employee-permissions/employee-permissions.model');
const emailSender = require("../../../helpers/emailSender");
const authModel = require("../auth/auth.model");

const create = async (req, res, next) => {
    const body = req.body;
    body['created_at'] = new Date().toISOString();
    body['created_by'] = req._user.employee_id;
    model.create(body).then(result => {
        return res.status(201).json({message: 'created.'});
   }).catch(err => {
        if (err.message && err.message.includes('duplicate key') && err.message.includes('employee_pkey')) {
            return res.status(400).json({message: 'This Employee ID was already taken!'});
        } else {
            return res.status(400).json({message: err.message});
        }
   });
};

const getAll = async (req, res, next) => {
    try {
        const result = await model.getAll(req.query);
        return res.status(200).json(result.rows);
    } catch (err) {
        return res.status(400).json({message: err.message});
    }
};

const getById = async (req, res, next) => {
    const employeeId = req.params.employeeId;
    try {
        const response = await model.getOne(employeeId);
        if (!response.rows[0]) {
            const error = new Error('Could not find an employee');
            error.statusCode = 404;
            throw error;
        }

        const selectedEmployee = response.rows[0];
        // ToDo:: It should be updated.
        const promises = [
            permissionTypeModel.getAll(),
            permissionFeatureModel.getAll(),
            employeePermissionModel.getOneWithTemplate(response.rows[0].employee_id),
            permissionTemplateModel.getDefault(),
        ];
        const [permissionTypes, permissionFeatures, employeePermission, defaultPermission] = await Promise.all(promises);
        const selectedPermission = employeePermission.rows[0] ? employeePermission.rows[0] : defaultPermission.rows[0];
        selectedEmployee['permission_template'] = makeFeatureField(selectedPermission, permissionFeatures.rows, permissionTypes.rows);
        return res.status(200).json(selectedEmployee);
    } catch (err) {
        return res.status(400).json({message: err.message});
    }
};

const makeFeatureField = (template, features, types) => {
    const resultTemplate = {
        id: template.id,
        template_name: template.template_name,
        template_desc: template.template_desc,
        date_created: template.date_created
    };
    features.forEach(feature => {
        resultTemplate[feature.feature] = types.find(type => type.permission_type === template[feature.feature]);
   });
    return resultTemplate;
};

const getWithProjects = (req, res, next) => {
    model.getWithProjects(req.query).then(result => {
        let rows = [];

        if (result && result.rows.length) {
            result.rows.forEach(v => {
                const index = rows.findIndex(row => row.id === v.id);
                if (index === -1) {
                    rows.push(v);
                } else {
                    rows[index]['project_name'] = rows[index]['project_name'] + ', ' + v['project_name'];
                }
           });
        }

        return res.status(200).json(rows);
   }).catch(err => {
        return res.status(400).json({message: err.message});
   });
};

const getDepartments = (req, res, next) => {
    model.getDepartments(req.query).then(result => {
        return res.status(200).json(result.rows);
   }).catch(err => {
        return res.status(400).json({message: err.message});
   });
};

const getPositions = (req, res, next) => {
    const dapart = req.params.department;
    model.getPositions(dapart).then(result => {
        return res.status(200).json(result.rows);
   }).catch(err => {
        return res.status(400).json({message: err.message});
   });
};

const getStatus = (req, res, next) => {
    model.getStatus(req.query).then(result => {
        return res.status(200).json(result.rows);
   }).catch(err => {
        return res.status(400).json({message: err.message});
   });
};

const updateByEmployeeId = async (req, res, next) => {
    const employee_id = req.params.employeeId;
    if (employee_id) {
        return model.getAll({employee_id}).then(result => {
            if (result && result.rows && result.rows[0]) {
                const id = result.rows[0].id;
                return model.update(id, req.body).then(updated => {
                    return res.status(202).json({message: 'success.'});
               }).catch(err => {
                    return res.status(400).json({message: err.message});
               });
            } else return res.status(400).json({error: 'Invalid data.'});
       }).catch(err => {
            return res.status(400).json({message: err.message});
       });
    }
};

const del = async (req, res, next) => {
    const id = req.params.id;
    try {
        const result = await model.getAll({id: id});
        if (result && result.rows && result.rows[0]) {
            let employee = result.rows[0];
            // delete project_employee table
            await modelProjectEmployee.unassignByEmployeeId(employee.employee_id);
            // delete employee_wp table
            await modelEmployeeWp.deleteByEmployeeId(employee.employee_id);
            // delete employee table
            // await model.delete(id);
            await model.update(id, { status_id: 22 });  // 22: In Active, TODO: get the list_enforcer_status
            return res.status(202).json({message: 'success.'});
        } else {
            return res.status(400).json({error: 'Invalid data.'});
        }
    } catch (e) {
        return res.status(400).json({error: e.message});
    }
};

const getCount = (req, res, next) => {
    model.getEmployeesCount().then(result => {
        if (result) {
            return res.status(200).json(result.rows[0]);
        }
   }).catch(err => {
        return res.status(400).json({message: err.message});
   });
};

const modifyCredentails = async(req, res, next) => {
  if(!req.body.employee_id){
      return res.status(400).json({message: 'Employee ID is missing'});
  }
  const result = await authModel.getById(req.body.employee_id);
  if (result && result.rows && result.rows[0]) {
      let employee = result.rows[0];
      employee.password = req.body.password;

      try {
          await authModel.resetPassword(employee);
          const mailResult = await emailSender.resetPassword(employee, req);
          return res.status(200).json({
              success: true,
              message: 'Reset Password Email has been sent to your email address! Please check your inbox.',
              mailResult: mailResult,
         });
      } catch (err) {
          return res.status(500).json({
              success: false,
              message: err.message,
         });
      }
  } else {
      return res.status(404).json({success: false, message: 'Username does not exist'});
  }
};

exports.create = create;
exports.getAll = getAll;
exports.getById = getById;
exports.getWithProjects = getWithProjects;
exports.getDepartments = getDepartments;
exports.getPositions = getPositions;
exports.getStatus = getStatus;
exports.updateByEmployeeId = updateByEmployeeId;
exports.del = del;
exports.getCount = getCount;
exports.modifyCredentails = modifyCredentails;