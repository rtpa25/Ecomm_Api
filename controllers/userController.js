/** @format */

//Dependencies
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;

//internal imports
const User = require('../models/User');
const cookieToken = require('../utils/cookieToken');
const mailHelper = require('../utils/emailHelper');

//-----SIGNUP CONTROLLER ----//
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

//-----LOGIN CONTROLLER ----//
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

//-----LOGOUT CONTROLLER ----//
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
  next();
};

//-----FORGOTPASSWORD CONTROLLER ----//
exports.forgotPassword = async (req, res, next) => {
  try {
    //get's the user's email from the request body
    const { email } = req.body;

    //check if the user is registered
    const user = await User.findOne({ email });

    //if not registered send error
    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Email not registered',
      });
    }
    //get the JWT token from the User's gettoken helper method
    const forgotToken = user.getForgotPasswordToken();

    //save the updated user in the db with the hashed token and expiry time
    await user.save({ validateBeforeSave: false });

    //construct a URL for changing password
    const forgotUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/password/reset/${forgotToken}`;

    //message that goes to the user via mail
    const forgotPasswordMessage = `Click on this link \n\n ${forgotUrl}`;
    try {
      //sends the forgotPassword mail to the user
      await mailHelper({
        email: user.email,
        subject: 'EcommApp - Password reset email',
        message: forgotPasswordMessage,
      });

      //email sent successfully
      res.status(200).json({
        sucess: true,
        message: 'email sent successfully',
      });
    } catch (error) {
      //if unable to send the mail then token and expiry time are reset
      user.forgotPasswordToken = undefined;
      user.forgotPasswordExpiry = undefined;

      //then the modified changes to the user are saved to the db
      await user.save({ validateBeforeSave: false });

      //send failure message
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  } catch (error) {
    //this is error where the process could not be initiated
    //due to server down or internet internet issues
    console.log(error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  next();
};

//-----FORGOTPASSWORD_RESET CONTROLLER ----//
exports.passwordReset = async (req, res, next) => {
  try {
    //get token from params
    const { token } = req.params;

    // hash the token as db also stores the hashed version
    const encryToken = crypto.createHash('sha256').update(token).digest('hex');

    // find user based on hased on token and time in future
    const user = await User.findOne({
      forgotPasswordToken: encryToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'User not found',
      });
    }
    //get the entered password from the client side
    const { password } = req.body;

    // update password field in DB
    user.password = password;

    // reset token fields
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    // save the user
    await user.save({ validateBeforeSave: false });

    // send a JSON response OR send token
    cookieToken(user, res);
  } catch (error) {
    //this error may happen due to server going down or client internet issue
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
  next();
};

//-----USER_DETAILS CONTROLLER ----//
exports.getLoggedInUserDetails = async (req, res, next) => {
  console.log(req.user.id);
  try {
    //this will be achived by the middleware injection
    const user = await User.findById(req.user.id);

    //give away the user details
    res.status(200).json({
      success: true,
      userDetails: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
