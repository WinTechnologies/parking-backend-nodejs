'use strict';
module.exports = (sequelize, DataTypes) => {
  var model = sequelize.define('cn_challenge', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    cn_number: DataTypes.BIGINT,
    review_id: DataTypes.INTEGER,
    decision: DataTypes.STRING,
    decision_reason: DataTypes.STRING,
    requested_by: DataTypes.STRING, // cn_review.reviewed_by
    requested_at: DataTypes.DATE,
    decided_by: DataTypes.STRING,
    decided_at: DataTypes.DATE,
  }, {
    timestamps: false,
    freezeTableName: true,
  });
  model.associate = function(models) {
    model.belongsTo(models.contravention, {
      foreignKey: 'cn_number',
      targetKey: 'cn_number'
    });

    model.belongsTo(models.cn_review, {
      foreignKey: 'review_id',
      targetKey: 'id'
    });

    model.belongsTo(models.employee, {
      as: 'requester',
      foreignKey: 'requested_by',
      targetKey: 'employee_id'
    });

    model.belongsTo(models.employee, {
      as: 'decider',
      foreignKey: 'decided_by',
      targetKey: 'employee_id'
    });
  };
  return model;
};
