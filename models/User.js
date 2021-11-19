/** @format */

//DEPENDENCIES
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

//Create Schema
const Schema = mongoose.Schema;

//Create a new instance of schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is a required field'], //message is for error cases
    maxlength: [40, 'Name should be atmost 40 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is a required field'],
    validate: [validator.isEmail, 'Please give a valid email'],
    unique: true, //automatically look in the db if this email already exists
  },
  password: {
    type: String,
    required: [true, 'Password is a required field'],
    minlength: [6, 'Password should be at least 6 characters'],
    select: false, //this is for not exposing password to the frontend
  },
  role: {
    type: String,
    default: 'user',
  },
  photo: {
    id: {
      type: String,
      required: true,
    },
    secure_url: {
      type: String,
      required: true,
    },
  },
  forgotPasswordToken: String,
  forgotPasswordExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now, //never call this function that will populate the current time to all entries
  },
});

//encrypt password before saving to database - HOOKS
UserSchema.pre('save', async function (next) {
  try {
    //if the password is not modified then just move on
    if (!this.isModified('password')) return next();
    //if password is modified then encrypt the password
    this.password = await bcrypt.hash(this.password, 10);
  } catch (error) {
    console.log(error);
  }
});

//validate the password while login
UserSchema.methods.isValidPassword = async function (userSendPassword) {
  //returns true if the password is correct
  return await bcrypt.compare(userSendPassword, this.password);
};

//create and return JWT token
UserSchema.methods.getJwtToken = function () {
  //auto generated _id by mongoDB
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};

//generate forgot password token (string)
UserSchema.methods.getForgotPasswordToken = function () {
  //generate a long random string and give to the frontend
  const forgotToken = crypto.randomBytes(20).toString('hex');
  //this hash will stored on the db and when user gives back the token
  //that can be verified by hashing and comparing it with the one that is in the db
  this.forgotPasswordToken = crypto
    .createHash('sha256')
    .update(forgotToken)
    .digest('hex');
  //expiry time of token
  this.forgotPasswordExpiry = Date.now() + 20 * 60 * 1000;
  //return the token to the user
  return forgotToken;
};

module.exports = mongoose.model('User', UserSchema);
