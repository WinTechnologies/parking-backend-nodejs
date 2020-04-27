const client = require('../../../helpers/postgresClient');
const TABLE_PROJECT = 'project';
const TABLE_PROJECT_EMPLOYEE = 'project_employee';
const TABLE_PROJECT_ACTIVITY = 'project_activity';
const TABLE_VAT = 'vat';
const TABLE_PARKING = 'parking';

exports.create = (body, currentUser) => {
    const query = `INSERT INTO ${TABLE_PROJECT} (
            project_name, type_establishment, img_url,
            created_at, center_latitude, center_longitude,
            contract_url, currency_code, project_team,
            start_date, end_date, project_code, project_location,
            gmt, documents, notes, vat_id,
            country_code, country_name, city_name, created_by)
        VALUES ($1, $2, $3,
            $4, $5, $6,
            $7, $8, $9,
            $10, $11, $12, $13,
            $14, $15, $16, $17,
            $18, $19, $20, $21) RETURNING *`;
    const args = [
        body.project_name, body.type_establishment, body.img_url,
        body.created_at, body.center_latitude, body.center_longitude,
        body.contract_url, body.currency_code, body.project_team,
        body.start_date, body.end_date? body.end_date : null, body.project_code, body.project_location,
        body.gmt, body.documents, body.notes, body.vat_id,
        body.country_code, body.country_name, body.city_name, currentUser
    ];
    return client.query(query, args);
};

exports.getAllProjectsOfConnectedUser = (connectedUser) => {
    let args = [];
    const query  = `SELECT  project.*,
                            vat.vat_code
                    FROM ${TABLE_PROJECT} project
                    JOIN ${TABLE_VAT} vat ON project.vat_id = vat.id
                    JOIN ${TABLE_PROJECT_EMPLOYEE} project_employee
                        ON  project_employee.project_id = project.id
                        AND project_employee.employee_id = '${connectedUser}'
                    WHERE project.deleted_at ISNULL AND project.deleted_by ISNULL
                    ORDER BY project.id ASC`;
    return client.query(query, args);
};

exports.getAllWithActivity = (values) => {
    let query = `SELECT project.*,
            activity.has_on_street,
            activity.has_car_park,
            activity.has_enforcement,
            activity.has_taxi_management,
            activity.has_valet_parking,
            activity.has_rental_car,
            vat.vat_code,
            vat.vat_country,
            vat.vat_percentage
        FROM ${TABLE_PROJECT} project,
            ${TABLE_PROJECT_ACTIVITY} activity,
            ${TABLE_VAT} vat
        WHERE   project.id = activity.project_id
            AND project.vat_id = vat.id 
            AND project.deleted_at IS NULL`;
    const args = [];

    Object.keys(values).forEach((field, index) => {
        query += ` and project.${field} = \$${index + 1}`;
        args.push(values[field]);
    });
    query += ' order by project.id asc';
    return client.query(query, args);
};

exports.update = (id, body) => {
    let updates = [];
    for(let field in body){
        if(body.hasOwnProperty(field) && (body[field] !== null || field === 'end_date') && field !== 'id'){
            updates.push(client.query(`UPDATE ${TABLE_PROJECT} SET ${field} = $1 WHERE id = $2`, [body[field], id]));
        }
    }
    return Promise.all(updates);
};

exports.getProjectById = (project_id) => {
    const query = `SELECT
                    project.*,
                    vat.*,
                    project.id as id,
                    vat.id as vat_id,
                    activity.has_on_street,
                    activity.has_car_park,
                    activity.has_enforcement,
                    activity.has_taxi_management,
                    activity.has_valet_parking,
                    activity.has_rental_car
                FROM ${TABLE_PROJECT} project
                LEFT JOIN ${TABLE_VAT} vat ON project.vat_id = vat.id
                LEFT JOIN ${TABLE_PROJECT_ACTIVITY} activity ON project.id = activity.project_id
                WHERE project.id = $1 `;
  return client.query(query, [project_id]);
};

exports.checkCodeExists = (params) => {
    let query;
    let args = [];

    if (params.id) {
        query = `(SELECT 1 FROM FROM ${TABLE_PROJECT} project WHERE id != $1 AND project_code = $2 )`;
        args = [params.id, params.code];
    } else {
        query = `(SELECT 1 FROM FROM ${TABLE_PROJECT} project WHERE project_code = $1 )`;
        args = [params.code];
    }
    return client.query(`SELECT EXISTS ${query}`, args);
};

exports.getProjectByName = (name) => {
    const query = `SELECT project.*
                  FROM ${TABLE_PROJECT} project
                  WHERE project.project_name = $1 `;
    return client.query(query, [name]);
};

exports.del = (id, body) => {
    // Update the project table status
    let updates = [];
    for(let field in body){
        if(body.hasOwnProperty(field) && (body[field] !== null || field === 'end_date') && field !== 'id'){
            updates.push(client.query(`UPDATE ${TABLE_PROJECT} SET ${field} = $1 WHERE id = $2`, [body[field], id]));
        }
    }
    // Update the end_date column of the project_employee table
    const query = `UPDATE ${TABLE_PROJECT_EMPLOYEE} SET end_date = NOW() WHERE project_id = $1`;
    updates.push(client.query(query, [id]));

    return Promise.all(updates);
};
