const employeeModel = require('../sequelize-models').employee;
const mqttPublisher = require('../../services/MQTT/publisher');
const MqttSubject = require('./employees.constants');

const updateEmployeeStatus = async(data) => {
    try{
        return await employeeModel.update(
            { status_id: data.user_status },
            { where: { employee_id: data.user_id} }
        ).then((result) => {
            const employee = employeeModel.findOne({
                where: {
                    employee_id: data.user_id
                }
            });
            // MQTT - publisher
            mqttPublisher.client.publish(
                MqttSubject.UpdatedEmployeeStatus,
                JSON.stringify(employee)
            );
        });
    } catch (err) {
        throw err;
    }
}

exports.updateEmployeeStatus = updateEmployeeStatus;