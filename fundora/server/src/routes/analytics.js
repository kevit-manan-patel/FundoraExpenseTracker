const r = require('express').Router();
const c = require('../controllers/analyticsController');
r.use(require('../middleware/auth'));
r.get('/overview', c.overview);
r.get('/report', c.report);
r.get('/daily', c.daily);
module.exports = r;
