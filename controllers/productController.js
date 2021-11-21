/** @format */

//Dependencies
const cloudinary = require('cloudinary').v2;

//internal imports
const Product = require('../models/Product');
const WhereClause = require('../utils/whereClause');

//-----GET_ALL_PRODUCTS CONTROLLER ----//
exports.getAllProduct = async (req, res, next) => {
  try {
    //the number of t-shirst that we are going to show up on a single page
    const resultPerPage = 6;
    //this filters the products according to the querry and returned paginated data
    const productsObj = new WhereClause(Product.find(), req.query)
      .search()
      .filter()
      .pager(resultPerPage);

    //base is basically the designed mongoose querry according to the request of the client
    let products = await productsObj.base.clone();
    const filteredProductCount = products.length;
    res.status(200).json({
      sucess: true,
      products: products,
      count: filteredProductCount,
    });
  } catch (error) {
    console.log(error);
    //server error
    res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
  next();
};

//-----GET_SINGLE_PRODUCT CONTROLLER ----//
exports.getOneProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(401).json({
        sucess: false,
        message: 'Product not found',
      });
    }
    res.status(200).json({
      sucess: true,
      product: product,
    });
  } catch (error) {
    console.log(error);
    //server error
    res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
  next();
};

//-----ADD_REVIEW CONTROLLER ----//
exports.addReview = async (req, res, next) => {
  try {
    //get all the info from request object
    const { rating, comment, productId } = req.body;
    //construct user review
    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment: comment,
    };
    //fetch the product that is being reviewed
    let product = await Product.findById(productId);
    //check if the same user has already reviewed the product
    let alreadyReview = product.reviews.find(
      (rev) => rev.user.toString() === req.user._id.toString()
    );
    //if alreadyReviewed then update
    if (alreadyReview) {
      product.reviews.forEach((review) => {
        if (review.user.toString() === req.user._id.toString()) {
          review.comment = comment;
          review.rating = rating;
        }
      });
      //if not reviewed already then add review
    } else {
      product.reviews.push(review);
      product.numberOfReviews = product.reviews.length;
    }
    //calculate the new ratings of the product
    product.ratings =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;
    //save the product into the db
    await product.save({
      validateBeforeSave: false,
    });
    //send a success message
    res.status(200).json({
      sucess: true,
      message: 'Review added successfully',
    });
  } catch (error) {
    console.log(error);
    //server error
    res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
  next();
};

//-----DELETE_REVIEW CONTROLLER ----//
exports.deleteReview = async (req, res, next) => {
  try {
    //get the product with the id from the params
    const { productId } = req.params;
    const product = await Product.findById(productId);

    //new reviews that does not have the value that is to be deleted
    //DONT SKIP CURLY BRACKETS HERE YOU WILL GET AN ERROR
    const reviews = product.reviews.filter((rev) => {
      rev.user.toString() === req.user._id.toString();
    });

    //updated length
    const numberOfReviews = reviews.length;

    // updated average rating
    const ratings =
      numberOfReviews === 0
        ? 0
        : reviews.reduce((acc, item) => item.rating + acc, 0) / numberOfReviews;

    //update in the db
    await Product.findByIdAndUpdate(
      productId,
      {
        reviews,
        ratings,
        numberOfReviews,
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    //success message
    res.status(200).json({
      sucess: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.log(error);
    //server error
    res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
  next();
};

//-----GET_REVIEW CONTROLLER ----//
exports.getReviewForOneProduct = async (req, res, next) => {
  try {
    //get all the reviews of a certain product form from the db
    const { productId } = req.params;
    const product = await Product.findById(productId);
    const reviews = product.reviews;
    //give the reviews
    res.status(200).json({
      sucess: true,
      reviews: reviews,
    });
  } catch (error) {
    console.log(error);
    //server error
    res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
  next();
};

//-----ADMIN_GET_ALL_PRODUCTS CONTROLLER ----//
exports.getAllProductsAdmin = async (req, res, next) => {
  try {
    //get all products not paginated
    const products = await Product.find({});
    res.status(200).json({
      sucess: true,
      products: products,
    });
  } catch (error) {
    console.log(error);
    //server error
    res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
  next();
};

//-----ADMIN_ADD_PRODUCT CONTROLLER ----//
exports.addProduct = async (req, res, next) => {
  try {
    //initialialize the array of image objects that will go to the db
    let imageArray = [];

    //if we do not receive files
    if (!req.files) {
      res.status(401).json({
        success: false,
        message: 'Images are required to be uploaded',
      });
    }

    //extract photos the request object
    const { photos } = req.files;

    //loop through photos and upload them cloudinary
    for (let i = 0; i < photos.length; i++) {
      let result = await cloudinary.uploader.upload(photos[i].tempFilePath, {
        folder: 'products',
      });

      //once upload complete push the image object to image array
      imageArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }

    //ovvertite the body of request object with relevant info
    req.body.photos = imageArray;
    req.body.user = req.user.id; //will be coming from middleware injection

    //save the product into the db
    const product = await Product.create(req.body);

    //send sucess message
    res.status(200).json({
      sucess: true,
      product: product,
    });
  } catch (error) {
    console.log(error);

    //server error
    res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
  next();
};

//-----ADMIN_UPDATE_PRODUCT CONTROLLER ----//
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      res.status(401).json({
        sucess: false,
        message: 'Product not found',
      });
    }
    let imagesArray = [];
    if (req.files) {
      for (let i = 0; i < product.photos.length; i++) {
        await cloudinary.uploader.destroy(product.photos[i].id);
      }
      //extract photos the request object
      const { photos } = req.files;

      //loop through photos and upload them cloudinary
      for (let i = 0; i < photos.length; i++) {
        let result = await cloudinary.uploader.upload(photos[i].tempFilePath, {
          folder: 'products',
        });

        //once upload complete push the image object to image array
        imagesArray.push({
          id: result.public_id,
          secure_url: result.secure_url,
        });
      }
    }

    req.body.photos = imagesArray;
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    //send sucess message
    res.status(200).json({
      sucess: true,
      product: product,
    });
  } catch (error) {
    console.log(error);

    //server error
    res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
  next();
};

//-----ADMIN_DELETE_PRODUCT CONTROLLER ----//
exports.deleteProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      res.status(401).json({
        sucess: false,
        message: 'Product not found',
      });
    }
    for (let i = 0; i < product.photos.length; i++) {
      await cloudinary.uploader.destroy(product.photos[i].id);
    }

    await product.remove();

    //send sucess message
    res.status(200).json({
      sucess: true,
      message: 'Product was deleted successfully',
    });
  } catch (error) {
    console.log(error);

    //server error
    res.status(500).json({
      sucess: false,
      message: error.message,
    });
  }
  next();
};
