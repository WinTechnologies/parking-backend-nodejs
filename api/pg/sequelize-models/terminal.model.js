'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('terminal', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        project_id: DataTypes.INTEGER, // REFERENCES project(id),
        zone_id: DataTypes.INTEGER, // REFERENCES project_zone(id),
        terminal_code: DataTypes.STRING,
        terminal_name: DataTypes.STRING,
        airport_code: DataTypes.STRING,
        airport_name: DataTypes.STRING,
        latitude: DataTypes.NUMERIC,
        longitude: DataTypes.NUMERIC,
        connecting_points: DataTypes.STRING,
        img_url: DataTypes.STRING,
        notes: DataTypes.STRING,
        created_by: DataTypes.STRING, // REFERENCES employee(employee_id),
        created_at: DataTypes.DATE,
        deleted_by: DataTypes.STRING, // REFERENCES employee(employee_id),
        deleted_at: DataTypes.DATE,
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

        model.belongsTo(models.project_zone, {
            as: 'zone',
            foreignKey: 'zone_id',
            targetKey: 'id'
        });

        model.belongsTo(models.employee, {
            as: 'creator',
            foreignKey: 'created_by',
            targetKey: 'employee_id'
        });

        model.belongsTo(models.employee, {
            as: 'remover',
            foreignKey: 'deleted_by',
            targetKey: 'employee_id'
        });
    };
    return model;
};
