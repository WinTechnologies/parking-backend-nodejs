'use strict';

module.exports = (sequelize, DataTypes) => {
    const model = sequelize.define('cashier_exit', {
        ticket_number: { type: DataTypes.STRING, allowNull: false, primaryKey: true }, // REFERENCES cashier_ticket(ticket_number)
        car_plate: { type: DataTypes.STRING, allowNull: false },
        car_country: { type: DataTypes.STRING, allowNull: false },
        car_type: { type: DataTypes.TEXT, allowNull: false },
        date_in: { type: DataTypes.DATE },
        lane_in_id: { type: DataTypes.INTEGER }, // REFERENCES lane(id),
        img_url_in: { type: DataTypes.STRING },
        date_out: { type: DataTypes.DATE },
        lane_out_id: { type: DataTypes.INTEGER }, // REFERENCES lane(id),
        img_url_out: { type: DataTypes.STRING },
        job_related: DataTypes.ARRAY(DataTypes.STRING),
        cn_related: DataTypes.ARRAY(DataTypes.STRING),
        operation_type: { type: DataTypes.STRING, allowNull: false },
        project_id: DataTypes.INTEGER, // REFERENCES project(id),
        vat_id: DataTypes.INTEGER, // REFERENCES vat(id),
        issued_by: DataTypes.STRING,
        issued_at: DataTypes.DATE,
    }, {
        timestamps: false,
        freezeTableName: true,
        tableName: 'cashier_exit_2'
    });
    model.associate = function (models) {
        // associations can be defined here
        model.belongsTo(models.project, {
            as: 'project',
            foreignKey: 'project_id',
            targetKey: 'id'
        });

        // FOREIGN KEY (ticket_number) REFERENCES cashier-ticket(ticket_number);
        model.belongsTo(models.cashier_ticket, {
            foreignKey: 'ticket_number',
            targetKey: 'ticket_number',
            as: 'ticket',
        });
        // FOREIGN KEY (ticket_number) REFERENCES escape(ticket_number);
        /*
        model.belongsTo(models.escape, {
            foreignKey: 'ticket_number',
            targetKey: 'ticket_number',
            as: 'escape',
        });*/
        // FOREIGN KEY (vat_id) REFERENCES vat(id);
        model.belongsTo(models.vat, {
            foreignKey: 'vat_id',
            targetKey: 'id',
            as: 'vat',
        });

        // Table cashier_exit add FOREIGN KEY (lane_in_id) REFERENCES lane(id);
        model.belongsTo(models.lane, {
            foreignKey: 'lane_in_id',
            targetKey: 'id',
            as: 'lane_in'
        });
        // Table cashier_exit add FOREIGN KEY (lane_out_id) REFERENCES lane(id); (edited)
        model.belongsTo(models.lane, {
            foreignKey: 'lane_out_id',
            targetKey: 'id',
            as: 'lane_out'
        });
    };
    return model;
};
