const client = require('../../../helpers/postgresClient');
const TABLE_NAME = 'promotion_parking';

const create = (body) => {
    let query = `insert into ${TABLE_NAME}`;
    query += ' (id, promotion_id, parking_id)';
    query += ' values (default, $1, $2)';
    const args = [
        body.promotion_id,
        body.parking_id
    ];

    return client.query(query, args);
};

const createParkingsByPromotion = (parkings, promotion_id) => {
    const promises = [];
    parkings.forEach(parking_id => {
        promises.push(create({parking_id, promotion_id}));
    });
    return Promise.all(promises);
};

const getAll = (params = {}) => {
    let args = [];
    let query = `select * from ${TABLE_NAME}`;

    Object.keys(params).forEach((field, index, fields) => {
        if(index === 0) query += ' where ';
        query += ` ${field} = \$${index + 1}`;
        args.push(params[field]);
        if(index < fields.length - 1) query +=  ' and ';
    });
    return client.query(query, args);
};


const getParkingsByPromotion = (promotion_id) => {
    const query = 'select project_zone.project_id as project_id, project_zone.id as zone_id, parking.id as parking_id ' +
      ' from promotion_parking , project_zone, parking ' +
      ' where ' +
      ' promotion_parking.parking_id = parking.id ' +
      ' and parking.zone_id = project_zone.id' +
      ' and promotion_parking.promotion_id = $1';
    return client.query(query, [promotion_id]);
};

const del = (id) => {
    const query = `delete from ${TABLE_NAME} where id = $1`;
    return client.query(query, [id]);
};

const delParkingsByPromotion = (promotion_id) => {
    const query = `delete from ${TABLE_NAME} where promotion_id = $1`;
    return client.query(query, [promotion_id]);
};

const update = (id, body) => {
    let query = `update ${TABLE_NAME} set parking_id = $1 and promotion_id = $2`;
    query += ` where id = ${id}`;
    return client.query(query, [body.parking_id, body.promotion_id]);
};

const updateBulk = (id, parkings, promotion_id) => {
    const promises = [];
    parkings.forEach(parking_id => {
        promises.push(update(id, {parking_id, promotion_id}));
    });
    return Promise.all(promises);
};

exports.create = create;
exports.createParkingsByPromotion = createParkingsByPromotion;
exports.getParkingsByPromotion = getParkingsByPromotion;
exports.getAll = getAll;
exports.update = update;
exports.updateBulk = updateBulk;
exports.del = del;
exports.delParkingsByPromotion = delParkingsByPromotion;
