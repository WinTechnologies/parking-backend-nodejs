'use strict';
module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('carpark_zone', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        carpark_id: DataTypes.INTEGER, // REFERENCES carpark(id),
        level_id: DataTypes.INTEGER, // REFERENCES level(id),
        name_en: DataTypes.STRING,
        name_ar: DataTypes.STRING,
        latitude: DataTypes.INTEGER,
        longitude: DataTypes.INTEGER,
        connecting_points: DataTypes.STRING,
        img_url: DataTypes.STRING,
        area: DataTypes.DOUBLE,
        perimeter: DataTypes.DOUBLE,
        measurement_unit: DataTypes.STRING,
        created_by: DataTypes.STRING, // REFERENCES employee(employee_id),
        deleted_by: DataTypes.STRING, // REFERENCES employee(employee_id),
        created_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE,
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    model.associate = function(models) {
        model.belongsTo(models.carpark, {
            as: 'carpark',
            foreignKey: 'carpark_id',
            targetKey: 'id'
        });

        model.belongsTo(models.carpark_level, {
            as: 'carpark_level',
            foreignKey: 'level_id',
            targetKey: 'id'
        });

        model.hasMany(models.parkspace, {
            as: 'parkspaces',
            foreignKey: 'carpark_zone_id',
            sourceKey: 'id'
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

        model.hasMany(models.gate, {
            as: 'gates',
            foreignKey: 'carpark_zone_id',
            sourceKey: 'id'
        });
    };
    return model;
};
