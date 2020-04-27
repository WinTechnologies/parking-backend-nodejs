'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('hhd_tracking', {
        imei: { type: DataTypes.STRING, allowNull: false },
        serial_number: { type: DataTypes.STRING},
        latitude: { type: DataTypes.STRING },
        longitude: { type: DataTypes.STRING },
        device_mode: { type: DataTypes.STRING },
        battery_status: { type: DataTypes.STRING },
        battery_level: { type: DataTypes.INTEGER },
        application_name: { type: DataTypes.STRING },
        user_status: { type: DataTypes.INTEGER },
        user_id: { type: DataTypes.STRING },
        sent_at: { type: DataTypes.DATE },
        project_id: { type: DataTypes.INTEGER }
    }, {
        timestamps: false,
        freezeTableName: true
    });
    model.associate = function(models) {
      // associations can be defined here
      model.belongsTo(models.project, {
          as: 'list_enforcement_status',
          foreignKey: 'user_status',
          targetKey: 'id'
      });
    };

    model.removeAttribute('id');
    return model;
};
