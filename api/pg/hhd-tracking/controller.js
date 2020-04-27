const hhdTrackingModel = require('../sequelize-models').hhd_tracking;

const create = async (req, res, next) => {
    try {
        const { imei, serial_number, latitude, longitude,
                device_mode, battery_status, battery_level,
                application_name, user_status, user_id, project_id } = req.body;

        const newBody = {
          imei,
          serial_number,
          latitude,
          longitude,
          device_mode,
          battery_status,
          battery_level,
          application_name,
          user_status,
          user_id,
          project_id,
          sent_at: new Date()
        };

        const result = await hhdTrackingModel.create(newBody);
        return res.status(200).json({ message: 'New hdd-tracking record is created successfully.' });
    } catch (err) {
        next(err);
    }
};

exports.create = create;