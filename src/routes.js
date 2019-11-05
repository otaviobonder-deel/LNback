const express = require('express');
const routes = express.Router();

routes.get('/', function(req, res) {
    res.send('Welcome to my node info API. Use correct routes');
});

routes.use('/lightning', require('./routes/lnd'));
routes.use('/finance', require('./routes/finance'));

module.exports = routes;
