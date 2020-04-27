'use strict';
module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('service', {
        id: { type: DataTypes.INTEGER, primaryKey: true,allowNull: false,autoIncrement: true },
        service_name_en: DataTypes.STRING,
        service_name_ar: DataTypes.STRING,
        fee: DataTypes.INTEGER,
        img_url: DataTypes.STRING,
        working_days: DataTypes.STRING,
        working_timeslot: DataTypes.STRING,
        description: DataTypes.STRING,
        term_condition: DataTypes.STRING,
        created_at: DataTypes.DATE,
        operation_type: DataTypes.STRING,
        fee_unit: DataTypes.STRING,
        fee_max: DataTypes.INTEGER,
        fee_max_unit: DataTypes.STRING,
        project_id: DataTypes.INTEGER,
        created_by: DataTypes.STRING,
        payment_type_code: DataTypes.STRING,
        code: DataTypes.STRING,
    }, {
        timestamps: false,
        freezeTableName: true,
    });
    model.associate = function(models) {
        model.belongsTo(models.employee, {
            as: 'creator',
            foreignKey: 'created_by',
            targetKey: 'employee_id'
        });

        model.belongsTo(models.project, {
          as: 'project',
          foreignKey: 'project_id',
          targetKey: 'id'
      });
    };
    return model;
};
