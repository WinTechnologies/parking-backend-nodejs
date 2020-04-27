'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('rmq_sale', {
        pndcode: DataTypes.STRING,
        pnddesc: DataTypes.STRING,
        pndoracleid: DataTypes.INTEGER,
        pndtype: DataTypes.STRING,
        parkcode: DataTypes.STRING,
        parkdesc: DataTypes.STRING,
        parkoracleid: DataTypes.INTEGER,
        chrono_id: DataTypes.INTEGER,
        device_id: DataTypes.INTEGER,
        batch_id: DataTypes.INTEGER,
        pnd_sale_id: DataTypes.INTEGER,
        valid: DataTypes.BOOLEAN,
        spend_duration: DataTypes.INTEGER,
        currency: DataTypes.STRING,
        server_date: DataTypes.STRING,
        products_tarif: DataTypes.STRING,
        products_producttype: DataTypes.INTEGER,
        products_productid: DataTypes.INTEGER,
        products_amount: DataTypes.INTEGER,
        products_paidduration: DataTypes.INTEGER,
        products_user: DataTypes.INTEGER,
        products_place: DataTypes.STRING,
        products_currency: DataTypes.STRING,
        products_origin: DataTypes.STRING,
        products_alphanumid: DataTypes.STRING,
        products_custom: DataTypes.STRING,
        products_freeduration: DataTypes.INTEGER,
        payments_details: DataTypes.STRING,

        sale_date: DataTypes.DATE,
        products_startdate: DataTypes.DATE,
        products_enddate: DataTypes.DATE,
    }, {
        timestamps: false,
        freezeTableName: true
    });
    model.associate = function(models) {
        // associations can be defined here
        model.belongsTo(models.asset_2, {
            as: 'asset_2',
            foreignKey: 'pndcode',
            targetKey: 'codification_id'
        });
    };
    return model;
};
