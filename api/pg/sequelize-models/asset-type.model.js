'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('asset_type_2', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false }, // REFERENCES asset-model type_id
        code: { type: DataTypes.STRING },
        name: { type: DataTypes.STRING },
        category_id: { type: DataTypes.INTEGER }, // category id
        icon_url: { type: DataTypes.STRING },
        created_by: { type: DataTypes.STRING },
        created_at: { type: DataTypes.DATE },
    }, {
        timestamps: false,
        freezeTableName: true
    });
    model.associate = function(models) {
        model.belongsTo(models.list_asset_category, {
            as: 'categories',
            foreignKey: 'category_id',
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
