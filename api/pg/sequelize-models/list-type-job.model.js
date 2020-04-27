'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('list_type_job', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        name: {type: DataTypes.STRING}, 
        code: { type: DataTypes.STRING },

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