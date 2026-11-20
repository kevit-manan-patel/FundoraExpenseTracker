const r = require('express').Router();
r.use(require('../middleware/auth'));
r.get('/', require('../controllers/insightsController').get);
module.exports = r;
