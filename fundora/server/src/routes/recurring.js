const r = require('express').Router();
const c = require('../controllers/recurringController');
r.use(require('../middleware/auth'));
r.route('/').get(c.list).post(c.create);
r.post('/:id/pay', c.pay);
r.patch('/:id/toggle', c.toggle);
r.route('/:id').put(c.update).delete(c.remove);
module.exports = r;
