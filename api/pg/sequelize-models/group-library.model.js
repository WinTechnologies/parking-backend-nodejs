'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('group_library', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        member: DataTypes.ARRAY(DataTypes.TEXT), // REFERENCES employee(employee_id),
        admin_by: DataTypes.ARRAY(DataTypes.TEXT), // REFERENCES employee(employee_id),
        created_by: DataTypes.STRING, // REFERENCES employee(employee_id),
        created_at: DataTypes.DATE,
        modified_by: DataTypes.STRING, // REFERENCES employee(employee_id),
        modified_at: DataTypes.DATE,
        name: DataTypes.STRING,
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    model.associate = function(models) {
        // associations can be defined here
        model.belongsTo(models.employee, {
            as: 'creator',
            foreignKey: 'created_by',
            targetKey: 'employee_id'
        });

        model.belongsTo(models.employee, {
            as: 'modifier',
            foreignKey: 'modified_by',
            targetKey: 'employee_id'
        });
    };
    return model;
};
