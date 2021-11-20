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
  next();
};

//-----CHANGE_PASSWORD CONTROLLER ----//
exports.changePassword = async (req, res, next) => {
  try {
    //user id accessed by middleware injection to request object
    const userId = req.user.id;
    //access the oldpassword and the newpassword from the client
    const { oldPassword, newPassword } = req.body;
    //find the user with the id and ovvertite the select false on the password
    const user = await User.findById({ _id: userId }).select('+password');
    //check if old password is correct
    const isCorrectOldPassword = await user.isValidPassword(oldPassword);
    if (!isCorrectOldPassword) {
      res.status(400).json({
        sucess: false,
        message: 'Old password is incorrect',
      });
    }
    //set password to the new password
    user.password = newPassword;
    //save the changes
    await user.save();
    //give the token and return the response by cookieToken function
    cookieToken(user, res);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
  next();
};

//-----UPDATE_USER_DETAILS CONTROLLER ----//
exports.updateUserDetails = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { name, email } = req.body;
    const { photo } = req.files;

    //check if there is no name or email from the client
    if (!(name || email || photo)) {
      res.status(400).json({
        sucess: false,
        message: 'change something to send an update request',
      });
    }
    //new data is the patched data that needs to saved in the db
    const newData = {
      name: name,
      email: email,
    };
    //if files exists in the request object's files property
    if (photo) {
      const user = await User.findById(id);
      const imageId = user.photo.id;

      //delete the current photo from cloudinary
      await cloudinary.uploader.destroy(imageId);

      //uploads the photo to cloudinary media library
      const result = await cloudinary.uploader.upload(photo.tempFilePath, {
        folder: 'users',
        width: 150,
        crop: 'scale',
      });

      //insert photo details to the new data object
      newData.photo = {
        id: result.public_id,
        secure_url: result.secure_url,
      };
    }
    //finds the user by id in the db and updates the user
    const user = await User.findByIdAndUpdate(id, newData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    //send the new user data back so that we save a get request in the client
    res.status(200).json({
      sucess: true,
      user: user,
    });
  } catch (error) {
    //in case of server down or fuckups from our side or internet issues with the client
    console.log(error);
    res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
  next();
};

//-----ADMIN_GET_ALL_USERS CONTROLLER ----//
exports.adminAllUser = async (req, res, next) => {
  try {
    const users = await User.find({});
    res.status(200).json({
      sucess: true,
      users: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
  next();
};

//-----ADMIN_GET_SINGLE_USER CONTROLLER ----//
exports.adminGetUserData = async (req, res, next) => {
  try {
    //get id by params
    const { id } = req.params;
    //find user from db
    const user = await User.findById(id);
    if (!user) {
      res.status(400).json({
        sucess: false,
        message: 'no such user exists',
      });
    }
    res.status(200).json({
      sucess: true,
      user: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
  next();
};

//-----ADMIN_UPDATE_SINGLE_USER CONTROLLER ----//
exports.adminUpdateOneUserDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    //check if there is no name or email from the client
    if (!(name || email || req.files)) {
      res.status(400).json({
        sucess: false,
        message: 'change something to send an update request',
      });
    }
    //new data is the patched data that needs to saved in the db
    const newData = {
      name: name,
      email: email,
      role: role,
    };
    //if files exists in the request object's files property
    if (req.files) {
      const { photo } = req.files;
      const user = await User.findById(id);
      const imageId = user.photo.id;

      //delete the current photo from cloudinary
      await cloudinary.uploader.destroy(imageId);

      //uploads the photo to cloudinary media library
      const result = await cloudinary.uploader.upload(photo.tempFilePath, {
        folder: 'users',
        width: 150,
        crop: 'scale',
      });

      //insert photo details to the new data object
      newData.photo = {
        id: result.public_id,
        secure_url: result.secure_url,
      };
    }
    //finds the user by id in the db and updates the user
    const user = await User.findByIdAndUpdate(id, newData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    //send the new user data back so that we save a get request in the client
    res.status(200).json({
      sucess: true,
      user: user,
    });
  } catch (error) {
    //in case of server down or fuckups from our side or internet issues with the client
    console.log(error);
    res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
  next();
};

//-----ADMIN_DELETE_USER CONTROLLER ----//
exports.adminDeleteUser = async (req, res, next) => {
  try {
    //get id from params
    const { id } = req.params;

    //fetch user from the db
    const user = await User.findById(id);
    if (!user) {
      res.status(401).json({
        sucess: false,
        message: 'No such user exists check the params',
      });
    }
    //get image id and delete the photo from cloudinary
    const imageId = user.photo.id;
    await cloudinary.uploader.destroy(imageId);

    //remove the user from the db
    await user.remove();

    //send sucess message
    res.status(200).json({
      sucess: true,
      message: 'User sucessfully deleted',
    });
  } catch (error) {
    //error on server side
    console.log(error);
    res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
  next();
};

//-----MANAGER CONTROLLER ----//
exports.managerAllUser = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' });
    res.status(200).json({
      sucess: true,
      users: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
  next();
};
