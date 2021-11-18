/** @format */

const express = require('express');
const router = express.Router();
const { home, homeDummy } = require('../controllers/homeController');

router.route('/').get(home);
router.route('/homeDummy').get(home);

//exports all the router
module.exports = router;
