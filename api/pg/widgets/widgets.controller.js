const onStreetController = require('./on-street-widget/on-street-widget.controller');
const enforcementController = require('./enforcement-widget/enforcement-widget.controller');
const carparkController = require('./car-park-widget/car-park-widget.controller');

const get = (req, res, next) => {
    Promise.all([
        enforcementController.getByQuery(req.query),
        onStreetController.getByQuery(req.query),
        carparkController.getByQuery(req.query)
    ])
    .then(([ enforcement, onStreet, carpark ]) => {
        return res.status(200).json({ enforcement, onStreet, carpark });
    })
    .catch(err => {
        return res.status(400).json({ message: err.message });
    });
};

exports.get = get;

