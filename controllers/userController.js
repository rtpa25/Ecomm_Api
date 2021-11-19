/** @format */

//Dependencies
const cloudinary = require('cloudinary').v2;

//internal imports
const User = require('../models/User');
const cookieToken = require('../utils/cookieToken');

exports.signup = async (req, res, next) => {
  try {
    //check if user has not provided photo
    if (!req.files) {
      //returns an error message
      return res.status(400).json({
        success: false,
        message: 'Uploading a photo is nessesary',
      });
    }

    //grab all the info from req.body after the edge cases
    const { name, email, password } = req.body;

    //check if the required fields are absent
    if (!(email || name || password)) {
      //returns an error message
      return res.status(400).json({
        success: false,
        message: 'Email, Password and Name are required',
      });
    }

    //get's the photo url
    let file = req.files.photo;

    //uploads the photo to cloudinary media library
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'users',
      width: 150,
      crop: 'scale',
    });

    //create an instance of the user object and store it in the collection
    const user = await User.create({
      name,
      email,
      password,
      photo: {
        id: result.public_id,
        secure_url: result.secure_url,
      },
    });

    //this utility function creates a JWT token and return the response
    cookieToken(user, res);
  } catch (error) {
    //if some error occurs (server down, internet issues with the user)
    console.log(error);
    //send error message
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  next();
};

exports.login = async (req, res, next) => {
  try {
    //get the email and password from the request body
    const { email, password } = req.body;

    //check if email and password are present
    if (!(email || password)) {
      res.status(400).json({
        success: false,
        message: 'Email and password is required',
      });
    }

    //check if the email and hence the user is in the db
    const user = await User.findOne({ email: email }).select('+password');

    //user not in db
    if (!user) {
      res.status(400).json({
        success: false,
        message: 'User in not registered',
      });
    }

    //take the password and validate if it is same with the one in db
    const isPasswordCorrect = await user.isValidPassword(password);

    //password sent by the user is not correct
    if (!isPasswordCorrect) {
      res.status(400).json({
        success: false,
        message: 'Password is wrong',
      });
    }

    //if password mathces then give him a cookie token
    cookieToken(user, res);

    //error occured due to internet issues or server down
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  next();
};

exports.logout = async (req, res, next) => {
  try {
    //delete the cookie and expire it
    res.cookie('token', null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

    //send success message
    res.status(200).json({
      success: true,
      message: 'Logout success',
    });
  } catch (error) {
    console.log(error);

    //send error message in cases of server down or internet issues
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
