'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('list_incident', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        code: {type: DataTypes.STRING}, 
        name_en: { type: DataTypes.STRING },
        name_ar: { type: DataTypes.STRING },
        img_url: { type: DataTypes.STRING },
        description: { type: DataTypes.STRING },

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