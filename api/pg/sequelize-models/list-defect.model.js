'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('list_defect', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name_en: { type: DataTypes.STRING },
        name_ar: { type: DataTypes.STRING },
        description: { type: DataTypes.STRING },
        created_by: { type: DataTypes.STRING },
        created_at: { type: DataTypes.DATE },
        deleted_by: { type: DataTypes.STRING },
        deleted_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
        freezeTableName: true
    });

    model.associate = function(models) {
        model.belongsTo(models.employee, {
            as: 'creator',
            foreignKey: 'created_by',
            targetKey: 'employee_id'
        });
        model.belongsTo(models.employee, {
            as: 'deleter',
            foreignKey: 'deleted_by',
            targetKey: 'employee_id'
        });
    };
    return model;
};
