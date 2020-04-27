'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('project_employee', {
        project_id : DataTypes.INTEGER, // REFERENCES project(id)
        employee_id: DataTypes.STRING, // REFERENCES employee(employee_id)
        start_date: DataTypes.DATE,
        end_date: DataTypes.DATE,
        supervisor_id: DataTypes.STRING,
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    model.associate = function(models) {
        // associations can be defined here
        model.belongsTo(models.employee, {
            as: 'employee',
            foreignKey: 'employee_id',
            targetKey: 'employee_id'
        });

        model.belongsTo(models.project, {
            as: 'project',
            foreignKey: 'project_id',
            targetKey: 'id'
        });
    };
    return model;
};
