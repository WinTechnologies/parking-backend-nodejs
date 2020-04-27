'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('list_job_cancellation_reason', {
        code: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
        name_en: { type: DataTypes.STRING},
        name_ar: { type: DataTypes.STRING},
        job_action_code: { type: DataTypes.STRING}, // code of the list-job-action
        description: { type: DataTypes.STRING},
        is_active: { type: DataTypes.BOOLEAN },
        created_by: { type: DataTypes.STRING }, // employee id
        created_at: { type: DataTypes.DATE },
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

        model.belongsTo(models.list_job_action, {
            as: 'action_code',
            foreignKey: 'job_action_code',
            targetKey: 'code'
        });
    };
    return model;
};
