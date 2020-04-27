'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('alert_accident', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name_en: { type: DataTypes.STRING },
        name_ar: { type: DataTypes.STRING },
        description: { type: DataTypes.STRING },
        latitude: { type: DataTypes.INTEGER },
        longitude: { type: DataTypes.INTEGER },
        vehicle_codification_id: { type: DataTypes.STRING },
        vehicle_plate_en: { type: DataTypes.STRING },
        vehicle_plate_ar: { type: DataTypes.STRING },
        user_status_id: { type: DataTypes.INTEGER },
        accident_pictures: { type: DataTypes.STRING },
        reported_by: { type: DataTypes.STRING },
        reported_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
        freezeTableName: true
    });

    model.associate = function(models) {
        model.belongsTo(models.employee, {
            as: 'reporter',
            foreignKey: 'reported_by',
            targetKey: 'employee_id'
        });
        model.belongsTo(models.list_enforcer_status, {
            as: 'user_status',
            foreignKey: 'user_status_id',
            targetKey: 'id'
        });
        model.belongsTo(models.asset_2, {
            as: 'asset',
            foreignKey: 'vehicle_codification_id',
            targetKey: 'codification_id'
        });
    };
    return model;
};
