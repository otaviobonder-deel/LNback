require('dotenv').config();
const cache = require('./src/middlewares/cache');
const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');

// const server = require('http').createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.ENVIRONMENT === 'development') app.use(morgan('dev'));

// set cache control
app.use(cache);

app.use('/api', require('./src/routes'));

app.listen(3333);
