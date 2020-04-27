'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('project_zone', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        project_id: DataTypes.INTEGER, // REFERENCES project(id),
        zone_code: DataTypes.STRING,
        zone_name: DataTypes.STRING,
        zone_name_ar: DataTypes.STRING,
        perimeter: DataTypes.DOUBLE,
        area: DataTypes.DOUBLE,
        measurement_unit: DataTypes.STRING,
        connecting_points: DataTypes.STRING,
        created_by: DataTypes.STRING, // REFERENCES employee(employee_id),
        created_at: DataTypes.DATE,
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    model.associate = function(models) {
        // associations can be defined here
        model.belongsTo(models.project, {
            as: 'project',
            foreignKey: 'project_id',
            targetKey: 'id'
        });

        model.belongsTo(models.employee, {
            as: 'creator',
            foreignKey: 'created_by',
            targetKey: 'employee_id'
        });
    };
    return model;
};
