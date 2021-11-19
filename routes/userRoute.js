/** @format */

//Dependencies
const express = require('express');

//Controllers
const {
  signup,
  login,
  logout,
  forgotPassword,
  passwordReset,
  getLoggedInUserDetails,
} = require('../controllers/userController');

//import middleware
const { isLoggedIn } = require('../middlewares/userMiddleware');

//create a router instance
const router = express.Router();

/*   /api/v1/signup   */
router.route('/signup').post(signup);

/*  /api/v1/login  */
router.route('/login').post(login);

/*  /api/v1/logout  */
router.route('/logout').get(logout);

/* /api/v1/forgotPassword  */
router.route('/forgotPassword').post(forgotPassword);

/* /api/v1/password/reset/:token  */
router.route('/password/reset/:token').post(passwordReset);

/* /api/v1/userDashboard  */
router.route('/userDashboard').get(isLoggedIn, getLoggedInUserDetails);

module.exports = router;
