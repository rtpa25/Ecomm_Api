/** @format */

//Dependencies
const express = require('express');

//Controllers
const { signup, login, logout } = require('../controllers/userController');

//create a router instance
const router = express.Router();

/*   /api/v1/signup   */
router.route('/signup').post(signup);

/*  /api/v1/login  */
router.route('/login').post(login);

/*  /api/v1/logout  */
router.route('/logout').get(logout);

module.exports = router;
