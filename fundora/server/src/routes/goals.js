const r = require('express').Router();
const c = require('../controllers/goalController');
r.use(require('../middleware/auth'));
r.route('/').get(c.list).post(c.create);
r.post('/:id/contribute', c.contribute);
r.route('/:id').put(c.update).delete(c.remove);
module.exports = r;
