'use strict';
module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('gate', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        carpark_zone_id: DataTypes.INTEGER, // REFERENCES carpark_zone(id),
        name_en: DataTypes.STRING,
        name_ar: DataTypes.STRING,
        latitude: DataTypes.INTEGER,
        longitude: DataTypes.INTEGER,
        img_url: DataTypes.STRING,
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

        model.hasMany(models.lane, {
            as: 'lanes',
            foreignKey: 'gate_id',
            sourceKey: 'id'
        });
    };
    return model;
};
