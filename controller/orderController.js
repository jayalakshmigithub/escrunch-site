const userRoute = require("../routes/userRoute");
const cartModel = require("../model/cartModel");
const userModel = require("../model/userModel");
const mongoose = require("mongoose");
const productModel = require("../model/productModel");
const categoryModel = require("../model/categoryModel");
const orderModel = require("../model/orderModel");
const auth = require("../middleware/authmiddleware");
const { configDotenv } = require("dotenv");
const crypto = require("crypto");
const razorpay = require("../helper/razorpay");

const orderlist = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const orders = await orderModel
      .find({ user: userId })
      .populate("items.product")
      .sort({ createdAt: -1 });
    res.render("users/orderlist", { orders });
    console.log("orders only", orders);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// const orderDetail = async (req, res) => {
//   try {
//     const orderId = req.params.orderId;

//     const order = await orderModel
//       .findById(orderId)
//       .populate("user items.product")
//       .populate("coupon")
//       .select(
//         "items user quantity orderStatus paymentMode totalAmount finalPrice createdAt"
//       );

//     // Manually populate user.address
//     await order.populate({
//       path: "user.address",
//       model: "users",
//     });

//     if (order.createdAt instanceof Date) {
//       console.log("order details", order);

//       res.render("users/userOrderDetails", {
//         order,
//         user,
//         coupon: order.coupon,
//       });
//     } else {
//       console.log("Invalid order date:", order.createdAt);
//       // Handle the case where order.createdAt is not a valid Date object
//       res.status(500).send("Internal Server Error");
//     }
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send("Internal Server Error");
//   }
// };

const orderDetail = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await orderModel
      .findById(orderId)
      .populate("user items.product")
      .populate("coupon")
      .select(
        "items user quantity orderStatus paymentMode totalAmount finalPrice createdAt"
      );

    // Manually populate user.address
    await order.populate({
      path: "user.address",
      model: "users",
    });

    // Fetch the user associated with the order
    const user = await userModel.findById(order.user);

    if (order.createdAt instanceof Date && user) {
      console.log("order details", order);

      res.render("users/userOrderDetails", {
        order,
        user,
        coupon: order.coupon,
      });
    } else {
      console.log("Invalid order date:", order.createdAt);
      // Handle the case where order.createdAt is not a valid Date object or user is not found
      res.status(500).send("Internal Server Error");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const action = req.query.action;
    console.log(orderId);

    const order = await orderModel
      .findById({ _id: orderId })
      .populate("user items.product");
    const orderStatus = await orderModel
      .findById({ _id: orderId })
      .populate("orderStatus");

    if (action === "cancel") {
      await orderModel.findByIdAndUpdate(orderId, { orderStatus: "Cancelled" });
    }
    // else if (action === 'return') {
    //   await orderModel.findByIdAndUpdate(orderId, { orderStatus: "Returned" });
    // }

    res.render("users/userOrderDetails", { order, orderStatus });
  } catch (error) {
    console.log(error.message);
  }
};

const cancelOrder = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const canceledOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { $set: { orderStatus: "cancelled" } },
      { new: true }
    );

    if (!canceledOrder) {
      return res.status(404).send({ error: "Order not found" });
    }

    const productUpdates = canceledOrder.items.map((orderItem) => ({
      productId: orderItem.product,
      quantity: orderItem.quantity,
    }));

    await Promise.all(
      productUpdates.map((update) =>
        productModel.findByIdAndUpdate(update.productId, {
          $inc: { stock: update.quantity },
        })
      )
    );

    const userId = canceledOrder.user._id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    const transactionType = "credit";

    user.wallet.balance += canceledOrder.totalAmount;

    const cancelID = canceledOrder._id.toString();
    // Push  new transaction to the wallet.transactions arr
    user.wallet.transactions.push({
      ID: cancelID,
      type: transactionType,
      amount: canceledOrder.totalAmount,
    });

    await user.save();
    res.redirect("/myorders");
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal Server Error" });
  }
};

const returnedOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const returnOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { $set: { orderStatus: "Returned" } },
      { new: true }
    );
    console.log("");
    console.log("inside return order function");

    if (!returnOrder) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error returning order:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const placeOrder = async (req, res) => {
  try {
    console.log("hiiii hlooo checkout ", req.body);
  } catch (err) {
    console.log(err);
  }
};
//  ----------------Razorpay-------------------

const userPayment = async (req, res) => {
  try {
    const category = await categoryModel.find();
    const { oid: orderId } = req.query;
    const order = orderModel.findById(orderId);
    console.log(" in userPayment", order);
    if (order.orderStatus === "ordered") {
      res.render("users/userPayment", {
        category,
        order,
        razorpay_key: process.env.RAZORPAY_KEY_ID,
      });
    }
  } catch (err) {
    console.log(err.message);
  }
};

const checkPayment = async (req, res) => {
  const userId = req.session.user_id;
  const { razorpayOrderId, razorpayPaymentId, secret } = req.body;
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
  let generatedSignature = hmac.digest("hex");
  if (generatedSignature == secret) {
    await orderModel.findOneAndUpdate(
      { "paymentDatas.id": razorpayOrderId },
      { orderStatus: "placed" }
    );
    await cartModel.findOneAndUpdate({ user: userId }, { products: [] });
    res.status(200).json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
};

const adminOrderLists = async (req, res) => {
  try {
    const ITEMS_PER_PAGE = 10;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;
    const totalCount = await orderModel.countDocuments();
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const orders = await orderModel
      .find({})
      .populate("user", "name email")
      .populate({ path: "items.product", select: "name price" })
      .sort({ createdAt: -1 })
      .skip(skipItems)
      .limit(ITEMS_PER_PAGE);

    res.render("admin/adminOrderLists", {
      orders,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const adminEditOrderLists = async (req, res) => {
  try {
    console.log("In adminEditOrderLists page");
    const orderId = req.query._id;

    const order = await orderModel
      .findById(orderId)
      .populate("user items.product coupon user.address");

    res.render("admin/adminOrderDetail", { order, coupon: order.coupon });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const adminEditOrderListPost = async (req, res) => {
  try {
    const orderId = req.body.id;
    const orderStatus = req.body.status;
    console.log(orderStatus);
    await orderModel.findByIdAndUpdate(orderId, { orderStatus: orderStatus });
    res.redirect("/admin/adminorderlists");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  orderlist,
  adminOrderLists,
  adminEditOrderLists,
  adminEditOrderListPost,
  orderDetail,
  placeOrder,
  editOrderDetails,
  userPayment,
  checkPayment,
  cancelOrder,
  returnedOrder,
};
