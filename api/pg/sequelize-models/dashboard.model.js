'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('dashboard', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        name: DataTypes.STRING,
        project_id : DataTypes.INTEGER, // REFERENCES project(id),
        is_public: DataTypes.BOOLEAN,
        group_library_id: DataTypes.ARRAY(DataTypes.INTEGER),
        created_by: DataTypes.STRING, // REFERENCES employee(employee_id),
        created_at: DataTypes.DATE,
        modified_by: DataTypes.STRING, // REFERENCES employee(employee_id),
        modified_at: DataTypes.DATE,
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    model.associate = function(models) {
        // associations can be defined here
        model.belongsTo(models.project, {
            as: 'project',
            foreignKey: 'project_id',
            targetKey: 'id'
        });

        model.hasMany(models.chart, {
            as: 'charts',
            foreignKey: 'dashboard_id',
            sourceKey: 'id'
        });

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
