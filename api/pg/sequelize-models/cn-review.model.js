'use strict';
module.exports = (sequelize, DataTypes) => {
  var model = sequelize.define('cn_review', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    cn_number: DataTypes.BIGINT,
    data_modification: DataTypes.STRING,
    decision: DataTypes.STRING,
    error: DataTypes.STRING,
    reviewed_by: DataTypes.STRING,
    reviewed_at: DataTypes.DATE,
    has_challenge: DataTypes.STRING,
    challenge_reason: DataTypes.STRING
  }, {
    timestamps: false,
    freezeTableName: true,
  });
  model.associate = function(models) {
    model.belongsTo(models.contravention, {
      foreignKey: 'cn_number',
      targetKey: 'cn_number'
    });

    model.belongsTo(models.employee, {
      foreignKey: 'reviewed_by',
      targetKey: 'employee_id'
    });
  };
  return model;
};
