/** @format */

//DEPENDENCIES
const mongoose = require('mongoose');

//Create Schema
const Schema = mongoose.Schema;

//Create a new instance of schema
const ProductSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [120, 'Product name must be shorter than 120 characters'],
  },
  price: {
    type: Number,
    required: [true, 'Product name is required'],
    maxlength: [5, 'Our customers are not that rich'],
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
  },
  photos: [
    {
      id: {
        type: String,
        required: true,
      },
      secure_url: {
        type: String,
        required: true,
      },
    },
  ],
  category: {
    type: String,
    required: [
      true,
      'please select category from: short-sleves, long-sleves, sweat-shirts, hoodies',
    ],
    enum: {
      values: ['shortsleves', 'longsleves', 'sweatshirts', 'hoodies'],
      message:
        'please select category from: short-sleves, long-sleves, sweat-shirts & hoodies',
    },
  },
  //updated later
  stock: {
    type: Number,
    required: [true, 'Please add a number to the stock'],
  },
  brand: {
    type: String,
    required: [true, 'Please add a brand for clothing'],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  numberOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

//collection will be products
module.exports = mongoose.model('Product', ProductSchema);
