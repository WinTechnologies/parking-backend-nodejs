'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('list_position', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        code: {type: DataTypes.STRING},
        name: { type: DataTypes.STRING },
        type_job_id: { type: DataTypes.INTEGER }, // ref list_type_job

        created_by: { type: DataTypes.STRING }, // employee id
        created_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
        freezeTableName: true
    });
    model.associate = function(models) {
        model.belongsTo(models.list_type_job, {
            as: 'list_type_job',
            foreignKey: 'type_job_id',
            targetKey: 'id'
        });
        model.belongsTo(models.employee, {
            as: 'creator',
            foreignKey: 'created_by',
            targetKey: 'employee_id'
        });
    };
    return model;
};
