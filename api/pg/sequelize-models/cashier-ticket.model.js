'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('cashier_ticket', {
        ticket_number: { type: DataTypes.STRING, allowNull: false, primaryKey: true }, // REFERENCES cashier_ticket(ticket_number)
        amount_due: DataTypes.FLOAT,
        amount_validated: DataTypes.FLOAT,
        amount_promo: DataTypes.FLOAT,
        amount_vat: DataTypes.FLOAT,
        amount_total: DataTypes.FLOAT,
        is_paid: DataTypes.BOOLEAN,
        paid_at: { type: DataTypes.DATE },
        paid_mode: DataTypes.STRING,
        unpaid_reason: DataTypes.STRING,
        card_transaction: DataTypes.STRING,
        detail_services: DataTypes.STRING,
        detail_tariffs: DataTypes.STRING,
        remark: DataTypes.STRING,
        action: DataTypes.STRING,
        category: DataTypes.STRING,
        approved_by: DataTypes.STRING,
        reference: DataTypes.STRING,
        issued_at: DataTypes.DATE,
        detail_promo: DataTypes.STRING,
    }, {
        timestamps: false,
        freezeTableName: true,
        tableName: 'cashier_ticket_2'
    });
    model.associate = function(models) {
        // associations can be defined here
        model.belongsTo(models.cashier_exit, {
            as: 'cashier_exit',
            foreignKey: 'ticket_number',
            targetKey: 'ticket_number'
        });
    };
    return model;
};
