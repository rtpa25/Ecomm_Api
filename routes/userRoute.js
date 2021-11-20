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
  changePassword,
  updateUserDetails,
  adminAllUser,
  adminGetUserData,
  managerAllUser,
  adminUpdateOneUserDetails,
  adminDeleteUser,
} = require('../controllers/userController');

//import middleware
const { isLoggedIn, customRole } = require('../middlewares/userMiddleware');

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

/* /api/v1/password/update  */
router.route('/password/update').patch(isLoggedIn, changePassword);

/* /api/v1/userDashboard/update  */
router.route('/userDashboard/update').patch(isLoggedIn, updateUserDetails);

/*****************************************ADMIN ONLY******************************************/

/* /api/v1/admin/allUsers  */
router
  .route('/admin/allUsers')
  .get(isLoggedIn, customRole('admin'), adminAllUser);

/* /api/v1/admin/user/:id  */
router
  .route('/admin/user/:id')
  //get request
  .get(isLoggedIn, customRole('admin'), adminGetUserData)
  //pur route
  .put(isLoggedIn, customRole('admin'), adminUpdateOneUserDetails)
  //delete route
  .delete(isLoggedIn, customRole('admin'), adminDeleteUser);

/*****************************************MANAGER ONLY******************************************/

/* /api/v1/manager/allUsers  */
router
  .route('/manager/allUsers')
  .get(isLoggedIn, customRole('manager'), managerAllUser);

module.exports = router;
