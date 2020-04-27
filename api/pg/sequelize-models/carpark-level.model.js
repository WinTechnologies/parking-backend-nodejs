'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('carpark_level', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        carpark_id: DataTypes.INTEGER, // REFERENCES carpark(id),
        code: DataTypes.STRING,
        name: DataTypes.STRING,
        img_url: DataTypes.STRING,
        connecting_points: DataTypes.STRING,
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
        model.belongsTo(models.carpark, {
            as: 'carpark',
            foreignKey: 'carpark_id',
            targetKey: 'id'
        });

        model.hasMany(models.carpark_zone, {
            as: 'carpark_zones',
            foreignKey: 'level_id',
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
    };
    return model;
};
