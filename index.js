/** @format */

//Dependencies
const cloudinary = require('cloudinary');

//in project imports
const app = require('./app');
const connectWithDb = require('./config/db');

//configure dotenv
require('dotenv').config();

//connect with db
connectWithDb();

//cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//server listening on <PORT>
app.listen(process.env.PORT, () => {
  console.log(`App listening on port ${process.env.PORT}!`);
});
