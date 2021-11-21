/** @format */
//require dependencies
const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const fileupload = require('express-fileupload');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

//Routes import statements
const home = require('./routes/home');
const user = require('./routes/userRoute');
const product = require('./routes/productRoute');
const payment = require('./routes/paymentRoute');
const order = require('./routes/orderRoute');

//initialialize the app
const app = express();

//cookies and file middleware
app.use(cookieParser());
app.use(
  fileupload({
    useTempFiles: true,
    tempFileDir: '/temp/',
  })
);

//middleware for swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//regular middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//morgan middleware
app.use(morgan('tiny'));

//router middleware
app.use('/api/v1', home);
app.use('/api/v1', user);
app.use('/api/v1', product);
app.use('/api/v1', payment);
app.use('/api/v1', order);

//export app
module.exports = app;
