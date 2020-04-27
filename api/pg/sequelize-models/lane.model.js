'use strict';
module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('lane', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        gate_id: DataTypes.INTEGER, // REFERENCES gate(id),
        name_en: DataTypes.STRING,
        name_ar: DataTypes.STRING,
        latitude: DataTypes.INTEGER,
        longitude: DataTypes.INTEGER,
        connecting_points: DataTypes.STRING,
        created_by: DataTypes.STRING,
        deleted_by: DataTypes.STRING,
        created_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE,
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    model.associate = function(models) {
        model.belongsTo(models.gate, {
            as: 'gate',
            foreignKey: 'gate_id',
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
