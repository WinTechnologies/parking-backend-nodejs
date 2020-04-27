'use strict';
module.exports = (sequelize, DataTypes) => {
  const model = sequelize.define('violation', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    project_id: DataTypes.INTEGER,
    violation_code: DataTypes.STRING,
    violation_name_en: DataTypes.STRING,
    violation_name_ar: DataTypes.STRING,
    icon_url: DataTypes.STRING,
    date_created: DataTypes.STRING,
  }, {
    timestamps: false,
    freezeTableName: true,
  });
  model.associate = function(models) {
    // associations can be defined here
  };
  return model;
};
