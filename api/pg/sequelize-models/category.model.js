'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('list_asset_category', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, // REFERENCES asset-model type_id
        name: { type: DataTypes.STRING },
        icon_url: { type: DataTypes.STRING },
        created_by: { type: DataTypes.STRING },
        created_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
        freezeTableName: true
    });
    model.associate = function(models) {
        // associations can be defined here
        model.belongsTo(models.employee, {
            as: 'creator',
            foreignKey: 'created_by',
            targetKey: 'employee_id'
        });
    };
    return model;
};
