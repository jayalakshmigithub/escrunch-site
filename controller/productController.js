const bodyParser = require('body-parser');

const mongoose = require('mongoose')
const sharp = require('sharp');
const bcrypt = require('bcrypt');
const { configDotenv } = require('dotenv');
const userModel = require('../model/userModel');
const productModel = require('../model/productModel');
const categoryModel = require('../model/categoryModel');
const cropImage = require('../multer/productImageCrop');
const product = require('../multer/product');
const catImgCrop = require('../multer/catImgCrop');



//-------------To display the product list page for admin------------------
const adminProducts = async(req,res)=>{
    try{
    
        const product = await productModel.find().populate('categoryname');
        console.log(product);
        res.render('admin/adminProducts',{ data: product });
    }catch(err){
        console.log(err.message);
    }

}
//----------to render the add category page for admin-------------

const adminAddProductPage = async (req, res) => {
  try {
    const category = await categoryModel.find();
    res.render('admin/adminAddProduct', { data: category, item: {} });
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Internal Server Error');
  }
};



//  addproduct changed to display the latest product on the top----------
// const adminAddProduct = async(req,res)=>{
//     console.log('In adminAddProduct function in product controller');
//     let product = req.body;
//     await cropImage.crop(req)
//     const images = req.files.map(file => file.filename);
// /////////
//     product.image = images;
//     try{
//         console.log(product);
//         await productModel.create(product);
        
//         res.redirect('/admin/adminProducts');

//     }catch(err){
//         console.log(err.message);
//     }
// }
//to GET edit product page by admin---------


// const adminEditProductPage = async(req,res)=>{
//     try{
//         const productId = req.body._id;
//         console.log('product id in admineditproductpage',productId);
//         const product = await productModel.findById(productId);
//         if(!product){
//             return res.status(404).json({ success: false,message:'product not found'});
//         }
//         const category = await categoryModel.find();
//         res.render('admin/adminEditProduct',{ productId:productId, products: product,category});

//     }catch(err){
//         console.log(err.message);
//         res.status(500).json({success: false, message: 'Server error'})
//     }

// }
// const adminEditProductPage = async (req, res) => {
//     try {
//         const productId = req.query._id; // Extract product ID from query parameters
//         console.log('product id in admineditproductpage', productId);
//         const product = await productModel.findById(productId);
//         if (!product) {
//             return res.status(404).json({ success: false, message: 'Product not found' });
//         }
//         const category = await categoryModel.find();
//         res.render('admin/adminEditProduct', { productId: productId, products: product, category });
//     } catch (err) {
//         console.log(err.message);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// }
//original
// const adminAddProduct = async (req, res) => {
//     console.log('In adminAddProduct function in product controller');
//     let product = req.body;
//     await cropImage.crop(req);
//     const images = req.files.map((file) => file.filename);
  
//     // Assign the images to the product
//     product.image = images;
  
//     try {
//       console.log(product);
//       await productModel.create(product);
  
//       // After adding the product, you can redirect to the product list page with the products sorted by ObjectId (_id) in descending order
//       const sortedProducts = await productModel.find().sort({ _id: -1 });
  
//       res.render('admin/adminProducts', { data: sortedProducts });
  
//     } catch (err) {
//       console.log(err.message);
//     }
//   };

// just to find the validation error
const adminAddProduct = async (req, res) => {
  let product = req.body;
  await cropImage.crop(req);
  const images = req.files.map((file) => file.filename);

  // Assign the images to the product
  product.image = images;

  try {
    await productModel.create(product);

    // After adding the product, you can redirect to the product list page with the products sorted by ObjectId (_id) in descending order
    const sortedProducts = await productModel.find().sort({ _id: -1 });

    res.render('admin/adminProducts', { data: sortedProducts });
  } catch (err) {
    // Check if the error is a Mongoose validation error
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map((error) => error.message);
      res.status(400).json({ errors: validationErrors });
    } else {
      console.error(err.message);
      res.status(500).send('Internal Server Error');
    }
  }
};




  





const adminEditProductPage = async (req, res) => {
    try {
        const productId = req.query._id;

        // Validate if productId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
          return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }
    
        // Continue with updating the product...
        ; // Use req.query instead of req.body
      console.log('product id in admineditproductpage', productId);
      const products = await productModel.findById(productId);
  console.log('hhhhhhhhhhhhhhh')
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
  
      const category = await categoryModel.find();
      console.log('xxxxxxxxxx')
      
      // Ensure 'products' is defined as an array or an empty array if there are multiple products
    //   const productss = Array.isArray(product) ? product : [product];
  console.log('pto',products)
      res.render('admin/adminEditProduct', { productId, products, category });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
  


// const adminEditProduct = async(req,res)=>{
//     try{
//         console.log('in adminEditProduct,,, its working or not');
//         const product = req.body;
//         const productId = req.query._id;
//         console.log("product id= &products=...",productId,product);
//         const validProductId = new mongoose.Types.ObjectId(productId);


//         const updatedProductData = {
//             productname: req.body.productname,
//             categoryname: req.body.categoryname,
//             description: req.body.description,
//             stock:req.body.stock,
//             price:req.body.price,
//             mrp:req.body.mrp,
//         };
//         if(req.files && req.files.length>0){
//             await cropImage.crop(req);
//             const images = req.files.map(file=> file.filename);
//             updatedProductData.image = images;

//         }
//         const updatedProduct = await productModel.findByIdAndUpdate(productId,updatedProductData,{
//              new: true,
//         });
//         //find the product by ID and update the data
//         if(!updatedProduct){
//             console.log('product not found or not updated');
//             console.log('invalid product ID:',validProductId);
//             return res.status(404).send('product not found or not updated');

//         }else{
//             console.log('product updated:',updatedProduct);
//             const products = await productModel.find();
//             console.log('product updated successfully');
//             //////////
//             res.redirect('/admin/adminProducts');

//         }

//     }catch(err){
//         console.log(err.message);

//     }
// }


// const adminEditProduct = async (req, res) => {
//     try {
//         console.log('in adminEditProduct,,, its working or not');
//         const productId = req.query._id;
//         console.log("product id= &products=...", productId, req.body);
//         const updatedProductData = {
//             productname: req.body.productname,
//             categoryname: req.body.categoryname,
//             description: req.body.description,
//             stock: req.body.stock,
//             price: req.body.price,
//             mrp: req.body.mrp,
//         };
//         console.log('kkkkkkkkkkk')
//         if (req.files && req.files.length > 0) {
//             // ... your image handling code
//         }
//         const updatedProduct = await productModel.findByIdAndUpdate(
//             new mongoose.Types.ObjectId(productId), // Create an instance of ObjectId
//             updatedProductData,
//             { new: true }
//         );
//         console.log('llllllllllllllll')
        
//         if (!updatedProduct) {
//             console.log('product not found or not updated');
//             console.log('invalid product ID:', productId);
//             return res.status(404).send('Product not found or not updated');
//         } else {
//             console.log('product updated:', updatedProduct);
//             const products = await productModel.find();
//             console.log('product updated successfully');
//             //////////
//             res.redirect('/admin/adminProducts');
//         }
//     } catch (err) {
//         console.log(err.message);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// }
const adminEditProduct = async (req, res) => {
    try {
        console.log('in adminEditProduct ,,, its working or not')
        //const productId = req.params.id; // Extract product ID from URL parameter
        //const productId = req.body.id;

        const product = req.body;          
        const productId = req.query._id;
        console.log("Prod id=  & product=..." , productId, product)
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
            const images = req.files.map(file => file.filename);
            updatedProductData.image = images;
        }
        // Find the product by ID and update the data
        const updateProduct = await productModel.findByIdAndUpdate(validProductId, updatedProductData);
        console.log('validProductId',validProductId)
        

        if (!updateProduct) {
            console.log('Product not found or not updated.');
            console.log('Invalid product ID:', validProductId);
            return res.status(404).send('Product not found or not updated.');
        } else {
            console.log('Product updated:', updateProduct);
            const products = await productModel.find();
            console.log('Product updated successfully');
            //const categories = await categoryModel.find().lean()
            //res.render('/admin/adminproducts', { products, categories});
            //res.render('admin/adminProducts', {data: products}) 
            res.redirect('/admin/adminproducts')
        
        }
    } catch (error) {
        console.log(error.message);
    }
}


// const adminDeleteImage = async (req, res) => {
//     const { id, file } = req.body
//     console.log('Received request to delete image. Product ID:', id, 'Image File:', file);
//     console.log("Printing file...in adminDeleteImage cntrller",file)
//     try {
//       await productModel.findByIdAndUpdate(id, { $pull: { image: file } })
//       res.status(200).json({ success: true })
//       console.log("Image Successfully Deleted")
//     } catch (error) {
//       console.error(error.message)
//       res.status(500).json({ success: false, message: 'Image deleting failed' })
//     }
//   }


const adminDeleteImage = async (req, res) => {
  const { id, file } = req.body;
  try {
      // Construct the image file path
      const path = require('path');
      const imagePath = path.join(__dirname, '..', 'public', 'uploadProductImages', file);

      // Check if the file exists
      const fs = require('fs');
      if (fs.existsSync(imagePath)) {
          // File exists, proceed with deletion.
          await fs.promises.unlink(imagePath); // Use async version to avoid blocking

          // Update the product in the database
          await productModel.findByIdAndUpdate(id, { $pull: { image: file } });

          res.status(200).json({ success: true });
      } else {
          console.error("File does not exist:", imagePath);
          res.status(404).json({ success: false, message: 'Image not found' });
      }
  } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ success: false, message: 'Image deleting failed' });
  }
};

// controllers/productController.js

// Function to list a product
const listProduct = async (req, res) => {
  const productId = req.params.productId;
console.log('gjos')
  try {
    // Update the product's status to 'Listed'
    await productModel.findByIdAndUpdate(productId, { status: 'Listed' });

    // Redirect to a product details page, product list, or another appropriate page
    res.redirect('/admin/adminproducts');
  } catch (err) {
    console.log(err.message);
    // Handle the error
  }
};

// Function to delist a product
const unlistProduct = async (req, res) => {
  const productId = req.params.productId;

  try {
    // Update the product's status to 'Delisted'
    await productModel.findByIdAndUpdate(productId, { status: 'Delisted' });

    // Redirect to a product details page, product list, or another appropriate page
    res.redirect('/admin/adminproducts');
  } catch (err) {
    console.log(err.message);
    // Handle the error
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