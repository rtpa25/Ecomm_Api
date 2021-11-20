/** @format */

//Dependencies
const express = require('express');

//Controllers
const { demo } = require('../controllers/productController');

//create a router instance
const router = express.Router();

/*   /api/v1/demo   */
router.route('/demo').get(demo);

module.exports = router;
