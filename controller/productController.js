const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const sharp = require("sharp");
const bcrypt = require("bcrypt");
const { configDotenv } = require("dotenv");
const userModel = require("../model/userModel");
const productModel = require("../model/productModel");
const categoryModel = require("../model/categoryModel");
const cropImage = require("../multer/productImageCrop");
const product = require("../multer/product");
const catImgCrop = require("../multer/catImgCrop");

//-------------To display the product list page for admin------------------
const adminProducts = async (req, res) => {
  try {
    const product = await productModel
      .find()
      .populate("categoryname")
      .sort({ createdAt: -1 });
    console.log(product);
    res.render("admin/adminProducts", { data: product });
  } catch (err) {
    console.log(err.message);
  }
};
//----------to render the add category page for admin-------------

const adminAddProductPage = async (req, res) => {
  try {
    const category = await categoryModel.find();
    res.render("admin/adminAddProduct", { data: category, item: {} });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Internal Server Error");
  }
};

// just to find the validation error
const adminAddProduct = async (req, res) => {
  let product = req.body;
  await cropImage.crop(req);
  const images = req.files.map((file) => file.filename);
  product.image = images;
  try {
    await productModel.create(product);
    const sortedProducts = await productModel.find().sort({ _id: -1 });
    res.render("admin/adminProducts", { data: sortedProducts });
  } catch (err) {
    if (err.name === "ValidationError") {
      const validationErrors = Object.values(err.errors).map(
        (error) => error.message
      );
      res.status(400).json({ errors: validationErrors });
    } else {
      console.error(err.message);
      res.status(500).send("Internal Server Error");
    }
  }
};

const adminEditProductPage = async (req, res) => {
  try {
    const productId = req.query._id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }
    console.log("product id in admineditproductpage", productId);
    const products = await productModel.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const category = await categoryModel.find();
    res.render("admin/adminEditProduct", { productId, products, category });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const adminEditProduct = async (req, res) => {
  try {
    console.log("in adminEditProduct ,,, its working or not");
    //const productId = req.params.id; // Extract product ID from URL parameter
    //const productId = req.body.id;

    const product = req.body;
    const productId = req.query._id;
    console.log("Prod id=  & product=...", productId, product);
    const validProductId = new mongoose.Types.ObjectId(productId);

    const updatedProductData = {
      productname: req.body.productname,
      categoryname: req.body.categoryname,
      description: req.body.description,
      stock: req.body.stock,
      // color: req.body.color,
      price: req.body.price,
      mrp: req.body.mrp,
      // isListed: true
    };
    if (req.files && req.files.length > 0) {
      await cropImage.crop(req);
      const images = req.files.map((file) => file.filename);
      updatedProductData.image = images;
    }
    const updateProduct = await productModel.findByIdAndUpdate(
      validProductId,
      updatedProductData
    );
    console.log("validProductId", validProductId);

    if (!updateProduct) {
      console.log("Product not found or not updated.");
      console.log("Invalid product ID:", validProductId);
      return res.status(404).send("Product not found or not updated.");
    } else {
      console.log("Product updated:", updateProduct);
      const products = await productModel.find();
      console.log("Product updated successfully");
      //const categories = await categoryModel.find().lean()
      //res.render('/admin/adminproducts', { products, categories});
      //res.render('admin/adminProducts', {data: products})
      res.redirect("/admin/adminproducts");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const adminDeleteImage = async (req, res) => {
  const { id, file } = req.body;
  try {
    const path = require("path");
    const imagePath = path.join(
      __dirname,
      "..",
      "public",
      "uploadProductImages",
      file
    );
    const fs = require("fs");
    if (fs.existsSync(imagePath)) {
      // File exists, proceed with deletion.
      await fs.promises.unlink(imagePath);
      await productModel.findByIdAndUpdate(id, { $pull: { image: file } });

      res.status(200).json({ success: true });
    } else {
      console.error("File does not exist:", imagePath);
      res.status(404).json({ success: false, message: "Image not found" });
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ success: false, message: "Image deleting failed" });
  }
};

const listProduct = async (req, res) => {
  const productId = req.params.productId;
  console.log("gjos");
  try {
    await productModel.findByIdAndUpdate(productId, { status: "Listed" });
    res.redirect("/admin/adminproducts");
  } catch (err) {
    console.log(err.message);
  }
};

// delist
const unlistProduct = async (req, res) => {
  const productId = req.params.productId;
  try {
    await productModel.findByIdAndUpdate(productId, { status: "Delisted" });
    res.redirect("/admin/adminproducts");
  } catch (err) {
    console.log(err.message);
  }
};

module.exports = {
  adminProducts,
  adminAddProductPage,
  adminAddProduct,
  adminEditProductPage,
  adminEditProduct,
  adminDeleteImage,
  listProduct,
  unlistProduct,
};
