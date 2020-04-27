const client = require('../../../helpers/postgresClient');
const EXIT_TABLE_NAME = 'cashier_exit_2';
const TICKET_TABLE_NAME = 'cashier_ticket_2';

/**
 * car_type
 * @param params {car_plate, car_type, project_id}
 * @returns {*}
 */
exports.getUnpaidTicket = (params) => {
    const { car_plate, car_type, project_id } = params;
    const query = `SELECT exit.*, ticket.*
        FROM ${EXIT_TABLE_NAME} AS exit
        LEFT JOIN ${TICKET_TABLE_NAME} AS ticket
            ON exit.ticket_number = ticket.ticket_number
        WHERE 
            exit.car_plate = $1 AND
            exit.car_type = $2 AND
            exit.project_id = $3 AND
            ticket.is_paid IS NOT TRUE`;
    return client.query(query, [car_plate, car_type, project_id]);
};

/**
 * Returns {"command":"INSERT","rowCount":1,"rows":[{ticket_number, cn_related, job_related}]}
 * @param body
 * @returns {*}
 */
exports.createExit = (body) => {
    let columns = '';
    let values = '';
    const args = [];

    Object.keys(body).forEach((field, index, fields) => {
        columns += index < (fields.length - 1) ? `${field},` : `${field}`;
        values += index < (fields.length - 1) ? `\$${index + 1},` : `\$${index + 1}`;
        if(body[field] !== null && body[field] !== '') {
            args.push(body[field]);
        } else {
            args.push(null);
        }
    });
    const query = `INSERT INTO ${EXIT_TABLE_NAME} (${columns}) VALUES (${values})
        RETURNING ticket_number, cn_related, job_related`;

    return client.query(query, args);
};

/**
 * Returns {"command":"INSERT","rowCount":1,"rows":[{ticket_number}]}
 * @param body
 * @returns {*}
 */
exports.createTicket = (body) => {
    let columns = '';
    let values = '';
    const args = [];

    Object.keys(body).forEach((field, index, fields) => {
        columns += index < (fields.length - 1) ? `${field},` : `${field}`;
        values += index < (fields.length - 1) ? `\$${index + 1},` : `\$${index + 1}`;
        if(body[field] !== null && body[field] !== '') {
            args.push(body[field]);
        } else {
            args.push(null);
        }
    });
    const query = `INSERT INTO ${TICKET_TABLE_NAME} (${columns}) VALUES (${values}) RETURNING ticket_number`;

    return client.query(query, args);
};

/**
 * Returns {"command":"UPDATE","rowCount":1,"rows":[{ticket_number, cn_related, job_related}]}
 * @param ticket_number
 * @param body
 * @returns {*}
 */
exports.updateExit = (ticket_number, body) => {
    let entries = '';
    const args = [];

    Object.keys(body).forEach((field, i, fields) => {
        if (i < (fields.length - 1)) {
            entries += `${field} = \$${i + 1},`;
        } else {
            entries += `${field} = \$${i + 1}`;
        }

        if (body[field] !== null && body[field] !== '') {
            args.push(body[field]);
        } else {
            args.push(null);
        }
    });

    const query = `UPDATE ${EXIT_TABLE_NAME} SET ${entries}
                    WHERE ticket_number = '${ticket_number}'
                    RETURNING ticket_number, cn_related, job_related`;

    return client.query(query, args);
};

/**
 * Returns {"command":"UPDATE","rowCount":1,"rows":[{ticket_number}]}
 * @param ticket_number
 * @param body
 * @returns {*}
 */
exports.updateTicket = (ticket_number, body) => {
    let entries = '';
    const args = [];

    Object.keys(body).forEach((field, i, fields) => {
        if (i < (fields.length - 1)) {
            entries += `${field} = \$${i + 1},`;
        } else {
            entries += `${field} = \$${i + 1}`;
        }

        if (body[field] !== null && body[field] !== '') {
            args.push(body[field]);
        } else {
            args.push(null);
        }
    });

    const query = `UPDATE ${TICKET_TABLE_NAME} SET ${entries}
                    WHERE ticket_number = '${ticket_number}'
                    RETURNING ticket_number`;

    return client.query(query, args);
};
