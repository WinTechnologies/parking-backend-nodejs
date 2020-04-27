'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('list_enforcer_status', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        name_en: { type: DataTypes.STRING},
        name_ar: { type: DataTypes.STRING },
        color: { type: DataTypes.STRING },
        description: { type: DataTypes.STRING },
        created_by: { type: DataTypes.STRING },
        created_at: DataTypes.DATE,
        type_job_id: { type: DataTypes.INTEGER },
        deleted_by: { type: DataTypes.STRING },
        deleted_at: DataTypes.DATE
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
        model.belongsTo(models.list_type_job, {
            as: 'type_job',
            foreignKey: 'type_job_id',
            targetKey: 'id'
        });
    };
    return model;
};
