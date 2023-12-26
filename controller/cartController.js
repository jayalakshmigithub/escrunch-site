const mongoose = require("mongoose");
const userRoute = require("../routes/userRoute");
const cartModel = require("../model/cartModel");
const userModel = require("../model/userModel");
const categoryModel = require("../model/categoryModel");
const orderModel = require("../model/orderModel");
 const productModel = require("../model/productModel");
const Product =require("../model/productModel")
const couponModel = require("../model/couponModel");

// const razorpayInstance = require("../helper/razorpay")
const Razorpay = require("razorpay");
const createRazorpayInstance = require('../helper/razorpay')
const { configDotenv } = require("dotenv").config();
const {RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
var instance= new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret:RAZORPAY_KEY_SECRET
})
//OG
const userCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    let cart = await cartModel.findOne({ user: userId });

    if (cart == null) {
      cart = await cartModel.create({ user: userId });
    }

    cart = await cartModel
      .findOne({ user: userId })
      .populate({ path: "products.product" });

    res.render("users/userCart", { cart });
  } catch (error) {
    console.log(error.message);
  }
};



// if (canProceed) {
//   res.render("users/userCheckout", { user, cart, category, coupon, discountAmount, couponId });
// } else {
//   res.render("users/userCart", { message: "Some products in your cart are out of stock. Please remove them before proceeding.", cart });
// }


//OG
// const addtocartpost = async (req, res) => {
//   // Set cache-control headers to prevent caching
//   res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
//   res.setHeader("Pragma", "no-cache");
//   res.setHeader("Expires", "0");
//   // calls when 'add to cart' is clicked (eg. from PRoduct details page)
//   const userId = req.session.user_id;
//   const { productId, quantity, price, totalPrice } = req.body;

//   try {
//     let cart = await cartModel.findOne({ user: userId });
//     if (cart == null) {
//       cart = await cartModel.create({ user: userId }); //if no cart, create cart for the user
//     }

//     if (cart.products.length === 0) {
//       //if  cart empty, adding the prdts, sent via the req
//       cart.products.push({
//         product: productId,
//         quantity,
//         price: +price,
//         totalPrice: +totalPrice,
//       });
//       res.status(200).json({ success: true });
//     } else {
//       let i;
//       for (i = 0; i < cart.products.length; i++) {
//         //if prdts there already, updating the cart with the new products
//         if (cart.products[i].product == productId) {
//           //if same prdt- update its quantity
//           cart.products[i].quantity += Number(quantity);
//           res.status(200).json({ success: true });

//           break;
//         }
//       }

//       if (i === cart.products.length) {
//         //if no same prdt found in the cart, add(push) the new prdts to the end
//         // cart.products.push({ product: productId, quantity });
//         cart.products.push({
//           product: productId,
//           quantity,
//           price: +price,
//           totalPrice: +totalPrice,
//         });
//         res.status(200).json({ success: true });
//       }
//     }
//     cart.save();
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).json({ success: false, message: "Something went wrong" });
//   }
// };





const addtocartpost = async (req, res) => {
  // Set cache-control headers to prevent caching
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  try {
    let cart = await cartModel.findOne({ user: req.session.user_id });

    if (!cart) {
      cart = await cartModel.create({ user: req.session.user_id });
    }

    const existingProduct = cart.products.find(product => product.product.equals(req.body.productId));

    if (existingProduct) {
      // Product is already in the cart, update its quantity
      existingProduct.quantity += Number(req.body.quantity);
    } else {
      // Product is not in the cart, add it
      cart.products.push({
        product: req.body.productId,
        quantity: Number(req.body.quantity),
        price: +req.body.price,
        totalPrice: +req.body.totalPrice,
      });
    }

    cart.save();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};


// for stock management


// const addtocartpost = async (req, res) => {
//   // Set cache-control headers to prevent caching
//   res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
//   res.setHeader("Pragma", "no-cache");
//   res.setHeader("Expires", "0");

//   try {
//     const productId = req.body.productId;
//     const requestedQuantity = Number(req.body.quantity);

//     // Fetch product details
//     const productData = await productId.findOne({ _id: productId });

//     if (!productData || productData.quantity < requestedQuantity) {
//       // Product not found or insufficient stock
//       return res.status(400).json({ success: false, message: "Product is out of stock" });
//     }

//     let cart = await cartModel.findOne({ user: req.session.user_id });

//     if (!cart) {
//       cart = await cartModel.create({ user: req.session.user_id });
//     }

//     const existingProduct = cart.products.find(product => product.product.equals(productId));

//     if (existingProduct) {
//       // Product is already in the cart, update its quantity
//       existingProduct.quantity += requestedQuantity;
//     } else {
//       // Product is not in the cart, add it
//       cart.products.push({
//         product: productId,
//         quantity: requestedQuantity,
//         price: +req.body.price,
//         totalPrice: +req.body.totalPrice,
//       });
//     }

//     // Deduct the sold quantity from the product stock
//     productData.quantity -= requestedQuantity;
//     await productData.save();

//     cart.save();
//     res.status(200).json({ success: true });
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).json({ success: false, message: "Something went wrong" });
//   }
// };














const removeFromCart = async (req, res) => {
  try {
    const { cartId, productId } = req.params;

    const cart = await cartModel.findById(cartId);
    if (!cart) {
      return res.status(404).json({ error: "cart not found" });
    }

    const productIndex = cart.products.findIndex(
      (product) => product.product.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ error: "product not found" });
    }
    //remove product from the product from proucts array
    cart.products.splice(productIndex, 1);

    await cart.save();
    res.redirect("/cart");
  } catch (error) {
    console.log("error deleting from cart", error);
    return res.status(500).json({ error: "internal server error" });
  }
};
// const updateCart = async (req, res) => {
//   const userId = req.session.user_id;
//   const { productID, quantity } = req.body;

//   try {
//     let cart = await cartModel.findOne({ user: userId });
//     if (!cart) {
//       cart.products.push({ product: productID, quantity });
//       res.status(200).json({ success: true });
//     } else {
//       let i;
//       for (i = 0; i < cart.produtcs.length; i++) {
//         if (cart.products[i].product == productId) {
//           cart.products[i].quantity = Number(quantity);
//           res.status(200).json({ success: true });

//           break;
//         }
//       }
//       if (i === cart.products.length) {
//         cart.products.push({ product: productID, quantity });
//         res.status(200).json({ success: true });
//       }
//     }
//     cart.save();
//   } catch (err) {
//     console.log(err);
//   }
// };
//the og
// const userCheckOut = async (req, res) => {
//   try {
//     const userId = req.session.user_id;
//     const cart = await cartModel
//       .findOne({ user: userId })
//       .populate({ path: "products.product" });
//     const user = await userModel.findById(userId);
//     const category = await categoryModel.find();
//     console.log('cart',cart)

//     res.render("users/userCheckout", { user, cart, category });
//   } catch (err) {
//     console.log(err.message);
//   }
// };



// OG I AM CHANGING FOR QTY ISSUE
// const updateCart = async (req, res) => {
//   const userId = req.session.user_id;
//   const { productID, quantity } = req.body;

//   try {
//     let cart = await cartModel.findOne({ user: userId });
    
//     if (!cart) {
//       // If the cart doesn't exist, create a new cart and add the product
//       const newCart = new cartModel({
//         user: userId,
//         products: [{ product: productID, quantity }]
//       });
//       await newCart.save();
//       res.status(200).json({ success: true });
//     } else {
//       // Check if the product is already in the cart
//       const existingProduct = cart.products.find(prod => prod.product == productID);

//       if (existingProduct) {
//         // If the product exists, update the quantity
//         existingProduct.quantity = Number(quantity);
//       } else {
//         // If the product is not in the cart, add it
//         cart.products.push({ product: productID, quantity });
//       }

//       await cart.save();
//       res.status(200).json({ success: true });
//     }
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ success: false, error: "Internal Server Error" });
//   }
// };


// const updateCart = async (req, res) => {
//   const userId = req.session.user_id;
//   const { productID, quantity } = req.body;

//   try {
//     // Check if Product model is properly imported
//     if (!productID) {
//       return res.status(500).json({ success: false, error: 'Product model not properly imported' });
//     }

//     // Find the user's cart
//     let cart = await cartModel.findOne({ user: userId });

//     if (!cart) {
//       // If the cart doesn't exist, create a new cart and add the product
//       const newCart = new cartModel({
//         user: userId,
//         products: [{ product: productID, quantity }],
//       });
//       await newCart.save();
//       return res.status(200).json({ success: true });
//     } else {
//       // Check if the product is already in the cart
//       const existingProduct = cart.products.find((prod) => prod.product.toString() === productID);

//       if (existingProduct) {
//         // If the product exists, update the quantity
//         existingProduct.quantity = Number(quantity);
//       } else {
//         // If the product is not in the cart, add it
//         const product = await Product.findById(productID);
//         if (!product) {
//           return res.status(404).json({ success: false, error: 'Product not found' });
//         }

//         // Add the product to the cart
//         cart.products.push({
//           product: product._id,
//           quantity,
//           price: product.price,
//           totalPrice: product.price * quantity,
//         });
//       }

//       // Save the updated cart
//       await cart.save();
//       return res.status(200).json({ success: true });
//     }
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ success: false, error: 'Internal Server Error' });
//   }
// };


// const updateCart = async (req, res) => {
//   console.log('enterd in updatecart')
//   const userId = req.session.user_id;
//   const { productID, quantity } = req.body;

//   try {
//     let cart = await cartModel.findOne({ user: userId });

//     if (!cart) {
//       cart = new cartModel({
//         user: userId,
//         products: [{ product: productID, quantity }],
//       });
//     } else {
//       let i;
//       for (i = 0; i < cart.products.length; i++) {
//         if (cart.products[i].product == productID) {
//           cart.products[i].quantity = Number(quantity);
//           break;
//         }
//       }
//       console.log('cartin updatecART',cart )

//       if (i === cart.products.length) {
//         const product = await Product.findById(productID);
//         if (!product) {
//           return res.status(404).json({ success: false, error: 'Product not found' });
//         }
//         console.log('enterd in the if in updatecart')

//         cart.products.push({
//           product: productID, // Ensure that product is set here
//           quantity,
//         });
//         console.log('in cart products')
//         console.log('product in updatecart',product)
//       }
     
//     }

//     // Explicitly set required fields before saving
//     cart.products.forEach((productEntry) => {
//       if (!productEntry.product) {
//         productEntry.product = null; // Set the product field to a default value if needed
//       }
//     });
// console.log('after that')
//     await cart.save(); // Ensure that save is awaited or use .then()

//     res.status(200).json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, error: 'Internal Server Error' });
//   }
// };



const updateCart = async (req, res) => {
  console.log('entered in updateCart');
  const userId = req.session.user_id;
  const { productID, quantity } = req.body;

  try {
    let cart = await cartModel.findOne({ user: userId });

    if (!cart) {
      // If the cart doesn't exist, create a new one
      cart = new cartModel({
        user: userId,
        products: [{ product: productID, quantity }],
      });
    } else {
      // If the cart exists, update the quantity of the specified product or add it if not found
      let found = false;
      for (let i = 0; i < cart.products.length; i++) {
        if (cart.products[i].product == productID) {
          cart.products[i].quantity = Number(quantity);
          found = true;
          break;
        }
      }

      if (!found) {
        // If the product was not found in the cart, add it
        const product = await Product.findById(productID);
        if (!product) {
          return res.status(404).json({ success: false, error: 'Product not found' });
        }

        cart.products.push({
          product: productID, // Set the product field to the product ID or another appropriate value
          quantity,
        });
      }
    }

    // Explicitly set required fields before saving
    cart.products.forEach((productEntry) => {
      if (!productEntry.product) {
        // Set the product field to a default value if needed
        productEntry.product = null;
      }
    });

    await cart.save(); // Ensure that save is awaited or use .then()

    console.log('Cart updated:', cart);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};











const userCheckOut = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const cart = await cartModel
      .findOne({ user: userId })
      .populate({ path: "products.product" });
    const user = await userModel.findById(userId);
    const category = await categoryModel.find();
    const coupon = req.query.couponCode || '';
    const discountAmount = req.query.discountAmount || 0;
    const couponId = req.query.couponId || '';

    // Check if any product in the cart is out of stock
    let canProceed = true;
    for (const cartItem of cart.products) {
      const stock = cartItem.product.stock;
      if (cartItem.quantity > stock) {
        canProceed = false;
        break;
      }
    }

    if (canProceed) {
      res.render("users/userCheckout", { user, cart, category, coupon, discountAmount, couponId });
    } else {
      res.render("users/userCart", { message: "Some products in your cart are out of stock. Please remove them before proceeding.", cart });
    }
  } catch (err) {
    console.log(err.message);
  }
};

//the og before stock management @ 2 48
// const userCheckoutPost = async (req, res) => {
//   try {
//     // Get the user ID from the session
//     const userId = req.session.user_id;

//     // Fetch the user from the database using the user ID
//     const user = await userModel.findById(userId).exec();
//     const { address, paymentMethod, couponId, subTotalPrice } = req.body;
//     const validatedCouponId = couponId === "" ? null : couponId;

//     // If the user is not found, return a 404 response
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     const user_id = user._id;

//     // Retrieve the user's cart
//     const orders = await cartModel.find({ user: user_id }).exec();

//     // Handle order processing, inventory updates, etc. (add your code here)

//     // Get the address for the order
//     let addressdetail;
//     user.address.forEach((item) => {
//       if (item._id.toString() == address) addressdetail = item;
//     });
//     let discountAmount = 100;

//     if (validatedCouponId) {
//       discountAmount = await couponModel.findById(validatedCouponId);
//       discountAmount = discountAmount ? discountAmount.discountAmount : 0;
//     }

//     const products = orders[0].products;

//     let finalPrice = +subTotalPrice - discountAmount;

//     // Create order details
//     const details = {
//       user: user_id,
//       items: [...products],
//       totalAmount: +subTotalPrice,
//       discountAmount: discountAmount,
//       paymentMode: paymentMethod,
//       finalPrice: finalPrice,
//       address: addressdetail,
//     };
//     console.log('subTotalPrice:', subTotalPrice);
//     console.log('amount:', parseInt(subTotalPrice) * 100);
//     console.log('grandtotal', finalPrice);

//     // Create the order
//     const response = await orderModel.create(details);
//     console.log('Order creation response:', response);

//     // Update the cart to remove items
//     await cartModel.findOneAndUpdate({ user }, { products: [] });

//     if (paymentMethod === "cashondelivery") {
//       res.status(200).json({ success: true, message: 'order placed successfully', paymentMethod: 'cashondelivery', response });
//     } else if (paymentMethod === 'onlinepayment') {
//       const options = {
//         amount: finalPrice * 100,
//         currency: "INR",
//         receipt: '12344'
//       };

//       // Initialize Razorpay
//       const instance = new Razorpay({
//         key_id: process.env.RAZORPAY_KEY_ID,
//         key_secret: process.env.RAZORPAY_KEY_SECRET
//       });

//       // Create the Razorpay order asynchronously using a Promise
//       const createRazorpayOrder = async (options) => {
//         return new Promise((resolve, reject) => {
//           instance.orders.create(options, (error, orderResponse) => {
//             if (error) {
//               reject(error);
//             } else {
//               resolve(orderResponse);
//             }
//           });
//         });
//       };

//       // Create the Razorpay order
//       const orderResponse = await createRazorpayOrder(options);

//       // Handle the response
//       res.status(200).send({
//         success: true,
//         order_id: orderResponse.id,
//         amount: parseInt(+subTotalPrice * 100),
//         key_id: process.env.RAZORPAY_KEY_ID
//       });
//     } else {
//       return res.status(400).json({ success: false, message: "Invalid payment method" });
//     }
//   } catch (error) {
//     console.error('Error placing order:', error);
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

//checkout post with stock management ie decresing the qty when order placed OG 21/12/23
// const userCheckoutPost = async (req, res) => {
//   try {
//     console.log('in checkout post')
//     // Get the user ID from the session
//     const userId = req.session.user_id;

//     // Fetch the user from the database using the user ID
//     const user = await userModel.findById(userId).exec();
//     const { address, paymentMethod, couponId, subTotalPrice } = req.body;
//     const validatedCouponId = couponId === "" ? null : couponId;

//     // If the user is not found, return a 404 response
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     const user_id = user._id;

//     // Retrieve the user's cart
//     const orders = await cartModel.find({ user: user_id }).exec();

//     // Handle order processing, inventory updates, etc. (add your code here)

//     // Get the address for the order
//     let addressdetail;
//     user.address.forEach((item) => {
//       if (item._id.toString() == address) addressdetail = item;
//     });
//     let discountAmount = 0;

//     if (couponId) {
//       discountAmount = await couponModel.findById(couponId);
//       discountAmount = discountAmount ? discountAmount.discountAmount : 0;
//     }

//     const products = orders[0].products;

//     let finalPrice = +subTotalPrice - discountAmount;

//     // Create order details
//     const details = {
//       user: user_id,
//       items: [...products],
//       totalAmount: +subTotalPrice,
//       coupon: validatedCouponId,
//       discountAmount: discountAmount,
//       paymentMode: paymentMethod,
//       finalPrice: finalPrice,
//       address: addressdetail,
//     };

//     // Loop through the products in the order and update their quantities
//     for (const product of products) {
//       const { product: productId, quantity } = product;
//       console.log(`Product ID: ${productId}, Quantity: ${quantity}`)
//       await  updateProductAfterOrder(productId, quantity);
//     }

//     // Create the order
//     const response = await orderModel.create(details);
//     console.log('Order creation response:', response);

//     // Update the cart to remove items
//     await cartModel.findOneAndUpdate({ user }, { products: [] });

//     if (paymentMethod === "cashondelivery") {
//       res.status(200).json({ success: true, message: 'order placed successfully', paymentMethod: 'cashondelivery', response });
//     } else if (paymentMethod === 'onlinepayment') {
//       const options = {
//         amount: finalPrice * 100,
//         currency: "INR",
//         receipt: '12344'
//       };

//       console.log('payment method in checkoutpost',paymentMethod)

//       // Initialize Razorpay
//       const instance = new Razorpay({
//         key_id: process.env.RAZORPAY_KEY_ID,
//         key_secret: process.env.RAZORPAY_KEY_SECRET
//       });

//       // Create the Razorpay order asynchronously using a Promise
//       const createRazorpayOrder = async (options) => {
//         return new Promise((resolve, reject) => {
//           instance.orders.create(options, (error, orderResponse) => {
//             if (error) {
//               reject(error);
//             } else {
//               resolve(orderResponse);
//             }
//           });
//         });
//       };

//       // Create the Razorpay order
//       const orderResponse = await createRazorpayOrder(options);

//       // Handle the response
//       res.status(200).send({
//         success: true,
//         order_id: orderResponse.id,
//         amount: parseInt(+subTotalPrice * 100),
//         key_id: process.env.RAZORPAY_KEY_ID
//       });
//     } else {
//       return res.status(400).json({ success: false, message: "Invalid payment method" });
//     }
//   } catch (error) {
//     console.error('Error placing order:', error);
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// }; 




const userCheckoutPost = async (req, res) => {
  try {
    console.log('in checkout post')
    // Get the user ID from the session
    const userId = req.session.user_id;

    // Fetch the user from the database using the user ID
    const user = await userModel.findById(userId).exec();
    const { address, paymentMethod, couponId, subTotalPrice } = req.body;
    const validatedCouponId = couponId === "" ? null : couponId;

    // If the user is not found, return a 404 response
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user_id = user._id;

    // Retrieve the user's cart
    const orders = await cartModel.find({ user: user_id }).exec();

    // Handle order processing, inventory updates, etc. (add your code here)

    // Get the address for the order
    let addressdetail;
    user.address.forEach((item) => {
      if (item._id.toString() == address) addressdetail = item;
    });
    let discountAmount = 0;

    if (couponId) {
      discountAmount = await couponModel.findById(couponId);
      discountAmount = discountAmount ? discountAmount.discountAmount : 0;
    }

    const products = orders[0].products;

    let finalPrice = +subTotalPrice - discountAmount;

    // Create order details
    const details = {
      user: user_id,
      items: [...products],
      totalAmount: +subTotalPrice,
      coupon: validatedCouponId,
      discountAmount: discountAmount,
      paymentMode: paymentMethod,
      finalPrice: finalPrice,
      address: addressdetail,
    };

    // Loop through the products in the order and update their quantities
    for (const product of products) {
      const { product: productId, quantity } = product;
      console.log(`Product ID: ${productId}, Quantity: ${quantity}`)
      await  updateProductAfterOrder(productId, quantity);
    }

    // Create the order
    const response = await orderModel.create(details);
    console.log('Order creation response:', response);

    // Update the cart to remove items
    await cartModel.findOneAndUpdate({ user }, { products: [] });

    if (paymentMethod === "cashondelivery") {
      console.log("payment method is cod",)
      res.status(200).json({ success: true, message: 'order placed successfully', paymentMethod: 'cashondelivery', response });
    } else if (paymentMethod === 'onlinepayment') {
      console.log("processing online payment")
      const options = {
        amount: finalPrice * 100,
        currency: "INR",
        receipt: '12344'
      };

      console.log('payment method in checkoutpost',paymentMethod)

      // Initialize Razorpay
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });

      // Create the Razorpay order asynchronously using a Promise
      const createRazorpayOrder = async (options) => {
        return new Promise((resolve, reject) => {
          instance.orders.create(options, (error, orderResponse) => {
            if (error) {
              reject(error);
            } else {
              resolve(orderResponse);
            }
          });
        });
      };

      // Create the Razorpay order
      const orderResponse = await createRazorpayOrder(options);

      // Handle the response
      res.status(200).send({
        success: true,
        order_id: orderResponse.id,
        amount: parseInt(+subTotalPrice * 100),
        key_id: process.env.RAZORPAY_KEY_ID
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }
  } catch (error) {
    console.error('Error placing order:', error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}; 

// Function to update product quantity
// Function to update product quantity and stock after placing an order
const updateProductAfterOrder = async (productId, quantity) => {
  try {
    
    const product = await productModel.findById(productId).exec();
    console.log('entered in new fn',product)

    if (!product) {
      console.error(`Product with ID ${productId} not found`);
      return;
    }

    // Update product quantity and stock
    product.quantity -= quantity;
    product.stock -= quantity;

    await product.save();
    console.log(`Product stock updated successfully. New stock: ${product.stock}`);
  } catch (error) {
    console.error(`Error updating product quantity and stock for product ID ${productId}: ${error.message}`);
  }
};

























module.exports = {
  userCart,
  addtocartpost,
  removeFromCart,
  updateCart,
  userCheckOut,
  userCheckoutPost,
  updateProductAfterOrder,
  
};
