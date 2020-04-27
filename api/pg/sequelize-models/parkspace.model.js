'use strict';
module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('parkspace', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        carpark_zone_id: DataTypes.INTEGER, // REFERENCES carpark_zone(id),
        code: DataTypes.STRING,
        name: DataTypes.STRING,
        img_url: DataTypes.STRING,
        notes: DataTypes.STRING,
        vehicle_type_id: DataTypes.INTEGER, // REFERENCES vehicle_type(id),
        for_handicap: DataTypes.BOOLEAN,
        is_sensor: DataTypes.BOOLEAN,
        created_by: DataTypes.STRING, // REFERENCES employee(employee_id),
        deleted_by: DataTypes.STRING, // REFERENCES employee(employee_id),
        created_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE,
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    model.associate = function(models) {
        model.belongsTo(models.carpark_zone, {
            as: 'carpark_zone',
            foreignKey: 'carpark_zone_id',
            targetKey: 'id'
        });

        model.belongsTo(models.vehicle_type, {
            as: 'vehicle_type',
            foreignKey: 'vehicle_type_id',
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
