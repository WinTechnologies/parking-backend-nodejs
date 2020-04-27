'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('list_job_action', {
        code: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
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
    };
    return model;
};
