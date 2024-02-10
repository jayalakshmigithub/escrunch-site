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

    cart = await cartModel.findOne({ user: userId }).populate({
      path: "products.product",
      select: "productName price stock image",
    });

    res.render("users/userCart", { cart });
  } catch (error) {
    console.log(error.message);
  }
};


const addtocartpost = async (req, res) => {
  try {
    console.log("in addtocart post fun");
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
      // add new product
      cart.products.push({
        product: req.body.productId,
        quantity: Number(req.body.quantity),
        price: +req.body.price,
        totalPrice: +req.body.totalPrice,
      });
    }

    await cart.save(); // Ensure that save is awaited
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
  console.log("in update cart function");
  const userId = req.session.user_id;
  const { productId, quantity } = req.body;
  try {
    let cart = await cartModel.findOne({ user: userId });
    console.log("cart ", cart);

    if (cart.products.length === 0) {
      cart.products.push({ product: productId, quantity });
      res.status(200).json({ success: true });
    } else {
      let i;
      for (i = 0; i < cart.products.length; i++) {
        if (cart.products[i].product == productId) {
          cart.products[i].quantity = Number(quantity);
          res.status(200).json({ success: true });
          break;
        }
      }

      if (i === cart.products.length) {
        cart.products.push({ product: productId, quantity });
        res.status(200).json({ success: true });
      }
    }
    console.log("qty", quantity);
    cart.save();
  } catch (error) {
    console.log(error.message);
  }
};

const userCheckOut = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const cart = await cartModel
      .findOne({ user: userId })
      .populate({ path: "products.product" });
      if(cart.products.length<=0){
        res.redirect("/home")
      }
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
    const { address, paymentMethod, subTotalPrice } = req.body;
    const couponId = req.query.couponId || "";
    const displayDiscountAmount = req.query.displayDiscountAmount || 0;
    const validatedCouponId = couponId === "" ? null : couponId;
    console.log("hhhh", displayDiscountAmount);

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

      if (coupon) {
        if (coupon.discountType === "Percentage") {
          discountAmount =
            Math.round((coupon?.discountAmount / 100) * +subTotalPrice) || 0;
        } else {
          discountAmount = displayDiscountAmount || 0;
        }
      }
    }

    const finalPrice = +subTotalPrice - discountAmount;
    const products = orders[0].products;

    // Create order details with a generated transaction ID
    const details = {
      user: user_id,
      items: [...products],
      totalAmount: +subTotalPrice,
      coupon: validatedCouponId,
      discountAmount: discountAmount,
      paymentMode: paymentMethod,
      finalPrice: finalPrice,
      address: addressdetail,
      orderID: `TX_${new Date().getTime()}_${Math.floor(
        Math.random() * 10000
      )}`,
    };

    // Order creation
    const response = await orderModel.create(details);

    // Deduct coupon amount for cashondelivery and onlinepayment
    if (
      paymentMethod === "cashondelivery" ||
      paymentMethod === "onlinepayment"
    ) {
      response.discountAmount = discountAmount; // Include displayDiscountAmount in the response
    }
    console.log("discount in chekoutpost", discountAmount);

    await cartModel.findOneAndUpdate({ user }, { products: [] }); // Update the cart to remove items

    if (paymentMethod === "cashondelivery") {
      console.log("payment method is cod");
      res.status(200).json({
        success: true,
        message: "order placed successfully",
        paymentMethod: "cashondelivery",
        response,
      });
    } else if (paymentMethod === "onlinepayment") {
      console.log("processing online payment");
      const options = {
        amount: finalPrice * 100,
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
      console.log("couponId in userCheckoutPost:", couponId);
      console.log("validatedCouponId in userCheckoutPost:", validatedCouponId);
      console.log(
        "displayDiscountAmount in userCheckoutPost:",
        displayDiscountAmount
      );

      // Create the Razorpay order
      const orderResponse = await createRazorpayOrder(options);
      res.status(200).send({
        success: true,
        order_id: orderResponse.id,
        amount: parseInt(finalPrice * 100),
        key_id: process.env.RAZORPAY_KEY_ID,
      });
    } else if (paymentMethod === "walletpayment") {
      if (user.wallet.balance >= finalPrice) {
        user.wallet.balance -= finalPrice;

        const transaction = {
          ID: details.orderID,
          createdAt: response.createdAt,
          type: "debit",
          amount: finalPrice,
        };

        user.wallet.transactions.push(transaction);
        userTransactions = user.wallet.transactions;
        await user.save();

        response.isPaid = true;
        response.orderStatus = "ordered";

        for (const orderItem of response.items) {
          orderItem.productOrderStatus = "ordered";
        }

        await response.save();
        await cartModel.findOneAndUpdate({ user: userId }, { products: [] });

        return res
          .status(200)
          .json({ success: true, url: `/orderdetails/${response._id}` });
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Insufficient wallet balance" });
      }
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
