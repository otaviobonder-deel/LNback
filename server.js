require('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');

const server = require('http').createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.ENVIRONMENT === 'development') app.use(morgan('dev'));

app.use('/api', require('./src/routes'));

server.listen(3333);
