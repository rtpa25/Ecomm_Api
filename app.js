/** @format */
//require dependencies
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const fileupload = require('express-fileupload');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

//configure dotenv
require('dotenv').config();

//Routes import statements
const home = require('./routes/home');

//initialialize the app
const app = express();

//cookies and file middleware
app.use(cookieParser());
app.use(fileupload());

//middleware for swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//regular middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//morgan middleware
app.use(morgan('tiny'));

//router middleware
app.use('/api/v1', home);

//export app
module.exports = app;
