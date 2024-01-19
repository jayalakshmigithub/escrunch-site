const mongoose = require("mongoose");
const userRoute = require("../routes/userRoute");
const cartModel = require("../model/cartModel");
const userModel = require("../model/userModel");
const categoryModel = require("../model/categoryModel");
const orderModel = require("../model/orderModel");
const productModel = require("../model/productModel");
const Product = require("../model/productModel");
const couponModel = require("../model/couponModel");
const Razorpay = require("razorpay");
const createRazorpayInstance = require("../helper/razorpay");
const { configDotenv } = require("dotenv").config();
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
var instance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

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
    const existingProduct = cart.products.find((product) =>
      product.product.equals(req.body.productId)
    );
    if (existingProduct) {
      // update quantity
      existingProduct.quantity += Number(req.body.quantity);
    } else {
      // add it
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

const updateCart = async (req, res) => {
  console.log("entered in updateCart");
  const userId = req.session.user_id;
  const { productID, quantity } = req.body;

  try {
    let cart = await cartModel.findOne({ user: userId });

    if (!cart) {
      // creating  new cart
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
          return res
            .status(404)
            .json({ success: false, error: "Product not found" });
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

    console.log("Cart updated:", cart);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
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
    const coupon = req.query.couponCode || "";
    const discountAmount = req.query.discountAmount || 0;
    const couponId = req.query.couponId || "";

    let canProceed = true;
    for (const cartItem of cart.products) {
      const stock = cartItem.product.stock;
      if (cartItem.quantity > stock) {
        canProceed = false;
        break;
      }
    }

    if (canProceed) {
      res.render("users/userCheckout", {
        user,
        cart,
        category,
        coupon,
        discountAmount,
        couponId,
      });
    } else {
      res.render("users/userCart", {
        message:
          "Some products in your cart are out of stock. Please remove them before proceeding.",
        cart,
      });
    }
  } catch (err) {
    console.log(err.message);
  }
};

const userCheckoutPost = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await userModel.findById(userId).exec();
    const { address, paymentMethod, couponId, subTotalPrice } = req.body;
    const validatedCouponId = couponId === "" ? null : couponId;

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const user_id = user._id;
    const orders = await cartModel.find({ user: user_id }).exec();

    let addressdetail;
    user.address.forEach((item) => {
      if (item._id.toString() == address) addressdetail = item;
    });
   let discountAmount = 0;

if (couponId) {
  const coupon = await couponModel.findById(couponId);

  // Assuming the coupon always has a discountType of 'Percentage'
  discountAmount = (coupon?.discountAmount / 100) * +subTotalPrice || 0;
}

const finalPrice = +subTotalPrice - discountAmount;
    
    const products = orders[0].products;
    


    // const products = orders[0].products;
    // let finalPrice = +subTotalPrice - discountAmount;

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

    for (const product of products) {
      // Loop through the products in the order and update their quantities
      const { product: productId, quantity } = product;
      console.log(`Product ID: ${productId}, Quantity: ${quantity}`);
      await updateProductAfterOrder(productId, quantity);
    }
    // order creation
    const response = await orderModel.create(details);
    console.log("Order creation response:", response);

    await cartModel.findOneAndUpdate({ user }, { products: [] }); // Update the cart to remove items

    if (paymentMethod === "cashondelivery") {
      console.log("payment method is cod");
      res
        .status(200)
        .json({
          success: true,
          message: "order placed successfully",
          paymentMethod: "cashondelivery",
          response,
        });
    } else if (paymentMethod === "onlinepayment") {
      console.log("processing online payment");
      const options = {
        amount: orders.finalPrice * 100,
        currency: "INR",
        receipt: "12344",
      };
      console.log("payment method in checkoutpost", paymentMethod);
      //Razorpay
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      // Creating Razorpay order
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
      res.status(200).send({
        success: true,
        order_id: orderResponse.id,
        amount: parseInt(+subTotalPrice * 100),
        key_id: process.env.RAZORPAY_KEY_ID,
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment method" });
    }
  } catch (error) {
    console.error("Error placing order:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
// to update product quantity and stock after placing an order
const updateProductAfterOrder = async (productId, quantity) => {
  try {
    const product = await productModel.findById(productId).exec();
    console.log("entered in new fn", product);

    if (!product) {
      console.error(`Product with ID ${productId} not found`);
      return;
    }
    // Update product quantity and stock
    product.quantity -= quantity;
    product.stock -= quantity;
    await product.save();
    console.log(
      `Product stock updated successfully. New stock: ${product.stock}`
    );
  } catch (error) {
    console.error(
      `Error updating product quantity and stock for product ID ${productId}: ${error.message}`
    );
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
