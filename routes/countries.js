var express = require('express');
var router = express.Router();
var authMiddleware = require('../middelware/authMiddleware');
var countriesHelper = require('../helpers/countries');

router.use(authMiddleware);

router.get('/', (req, res, next) => {
    if (req.query.currency) {
       return res.json(countriesHelper.searchCurrency(req.query.currency));
    } else if (req.query.q)  {
        return res.json(countriesHelper.search(req.query.q));
    }
});

router.get('/currencies', (req, res, next) => {
    return res.json(countriesHelper.searchCurrency(req.query.q));
});


module.exports = router;