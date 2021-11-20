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
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(401).json({
        sucess: false,
        message: 'Product not found',
      });
    }
    let imagesArray = [];
    if (req.files) {
      for (let i = 0; i < product.photos.length; i++) {
        const response = await cloudinary.uploader.destroy(
          product.photos[i].id
        );
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
    const product = await Product.findById(req.params.id);

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
