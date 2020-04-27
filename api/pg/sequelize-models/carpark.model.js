'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('carpark', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        project_id: DataTypes.INTEGER, // REFERENCES project(id),
        zone_id: DataTypes.INTEGER, // REFERENCES project_zone(id),
        terminal_id: DataTypes.INTEGER, // REFERENCES terminal(id),
        code: DataTypes.STRING,
        carpark_name: DataTypes.STRING,
        name_ar: DataTypes.STRING,
        latitude: DataTypes.DECIMAL,
        longitude: DataTypes.DECIMAL,
        connecting_points: DataTypes.STRING,
        img_url: DataTypes.STRING,
        /* Enum ['Enforcement', 'Carpark']*/
        operation_type: DataTypes.STRING,
        is_automated: DataTypes.BOOLEAN,
        type_id: DataTypes.INTEGER, // REFERENCES list_type_carpark(id),
        managed_by: DataTypes.STRING, // REFERENCES employee(employee_id),
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

        model.belongsTo(models.terminal, {
            as: 'terminal',
            foreignKey: 'terminal_id',
            targetKey: 'id'
        });

        model.belongsTo(models.list_type_carpark, {
            as: 'carpark_type',
            foreignKey: 'type_id',
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

        model.hasMany(models.carpark_zone, {
            as: 'carpark_zones',
            foreignKey: 'carpark_id',
            sourceKey: 'id'
        });
    };
    return model;
};
