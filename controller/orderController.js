const userRoute = require('../routes/userRoute');
const cartModel = require('../model/cartModel');
const userModel = require('../model/userModel');
const mongoose = require('mongoose');
const productModel = require('../model/productModel');
const categoryModel = require('../model/categoryModel');
const orderModel = require('../model/orderModel');
const auth = require('../middleware/authmiddleware');
// const { updateProductAfterCancel} = require('../controller/cartController')
const { configDotenv } =require('dotenv');
const crypto = require("crypto");
const razorpay = require("../helper/razorpay");




const orderlist = async (req, res) => {
  try {
    const userId = req.session.user_id
    // Assuming you have a function to fetch orders from the database
    const orders = await orderModel.find({user:userId}).populate("items.product").sort({createdAt: -1}) 
    res.render('users/orderlist', { orders }); // Pass the 'orders' variable to the template
    console.log('orders only',orders)
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// const userOrderConfirmation = async (req, res) => {
//   try {

//     // res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
//     // res.setHeader('Pragma', 'no-cache');
//     // res.setHeader('Expires', '0');
//     // res.setHeader('Surrogate-Control', 'no-store');

    
//     // const category = await categoryModel.find();
//     // const orderId = req.params.id;
//     // const userId = req.session.user_id;
//     // const user = await userModel.findById(userId);
//     // const order = await orderModel.findById(orderId).populate("items.product address");
//     //   await order.save();
//     //   await user.save();
  
//     console.log('printing order in confirmation',order);

//     // Render the 'userConfirmation' template
//     res.render("users/userOrderConfirmation", { order, user, category });
//   } catch (error) {
//     console.log(error.message);
//   }
// }




// const orderDetail = async (req, res) => {
//   try {
    
//   const orderId = req.params.orderId;
//   console.log("here",orderId)
//   const order = await orderModel.findById({_id:orderId}).populate('user items.product  address')
//   res.render("users/userOrderDetails",{order});
//   } catch (error) {
//     console.log(error.message); 
//   }
// }
//  const orderDetail = async (req, res) => {
//     try {
//       const orderId = req.params.orderId;
//       console.log("here", orderId);
  
//       const order = await orderModel
//         .findById({ _id: orderId })
//         .populate('user items.product')
//         .populate({
//           path: 'items.product',
//           model: 'products', 
//         })
//         .select('items address quantity orderStatus paymentMode totalAmount finalPrice') 
//         console.log('order details',order)

  
//       res.render("users/userOrderDetails",{order});
//     } catch (error) {
//       console.log(error.message);
//   }
// }

// const orderDetail = async (req, res) => {
//   try {
//     const orderId = req.params.orderId;
//     console.log("here", orderId);

//     const order = await orderModel
//       .findById({ _id: orderId })
//       .populate('user items.product')
//       .populate({
//         path: 'items.product',
//         model: 'products', 
//       })
//       .select('items address quantity orderStatus paymentMode totalAmount finalPrice') 
//       console.log('order details',order)


//     res.render("users/userOrderDetails",{order});
//   } catch (error) {
//     console.log(error.message);
// }
// }
const orderDetail = async (req, res) => {
  try {
      const orderId = req.params.orderId;

      const order = await orderModel
          .findById(orderId)
          .populate('user items.product')
          .select('items user quantity orderStatus paymentMode totalAmount finalPrice');

      // Manually populate user.address
      await order.populate({
          path: 'user.address',
          model: 'users',
      });

      console.log('order details', order);

      res.render("users/userOrderDetails", { order });
  } catch (error) {
      console.log(error.message);
  }
};







//currently working

const editOrderDetails =  async (req, res) => {
  try { 
    const orderId = req.params.id;
    const action = req.query.action
    console.log(orderId)

    const order = await orderModel.findById({_id:orderId}).populate('user items.product');
    const orderStatus = await orderModel.findById({_id:orderId}).populate('orderStatus')

    

    if (action === 'cancel') {
      await orderModel.findByIdAndUpdate(orderId, {orderStatus: "Cancelled" });
    }
    // else if (action === 'return') {
    //   await orderModel.findByIdAndUpdate(orderId, { orderStatus: "Returned" });
    // }

    res.render("users/userOrderDetails",{order,orderStatus});
  } catch (error) {
    console.log(error.message);
  }
}

//cancel order code that worked(not single product)

// const cancelOrder = async (req, res) => {
//   const orderId = req.params.orderId;

//   try {
//     // Find the order by ID and update the orderStatus to 'cancelled'
//     const updatedOrder = await orderModel.findByIdAndUpdate(
//       orderId,
//       { $set: { orderStatus: 'cancelled' } },
//       { new: true }
//     );

//     if (!updatedOrder) {
//       return res.status(404).send({ error: 'Order not found' });
//     }

//     res.redirect('/myorders'); // Redirect to the home page or any other appropriate page
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ error: 'Internal Server Error' });
//   }
// };



// const cancelOrder = async (req, res) => {
//   const orderId = req.params.orderId;
//   try {
//     // Find the order by ID and update the orderStatus to 'cancelled'
//     const canceledOrder = await orderModel.findByIdAndUpdate(
//       orderId,
//       { $set: { orderStatus: 'cancelled' } },
//       { new: true }
//     );
//     if (!canceledOrder) {
//       return res.status(404).send({ error: 'Order not found' });
//     }
//     // Fetch the user by ID
//     const userId = canceledOrder.user._id; // Assuming userId is stored in the order document
//     const user = await userModel.findById(userId);
//     if (!user) {
//       return res.status(404).send({ error: 'User not found' });
//     }
//     user.wallet.balance += canceledOrder.totalAmount;
//     const cancelID = String(canceledOrder._id);
//     // Push a new transaction to the wallet.transactions array
//     user.wallet.transactions.push({
//       ID: cancelID, // Convert ObjectId to string
//       type: 'credit',
//       amount: canceledOrder.totalAmount,
//     });
//     await user.save();
//     res.redirect('/myorders'); // Redirect to the home page or any other appropriate page
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ error: 'Internal Server Error' });
//   }
// };
//currently working code
// const cancelOrder = async (req, res) => {
//   const orderId = req.params.orderId;

//   try {
//     // Find the order by ID and update the orderStatus to 'cancelled'
//     const canceledOrder = await orderModel.findByIdAndUpdate(
//       orderId,
//       { $set: { orderStatus: 'cancelled' } },
//       { new: true }
//     );

//     if (!canceledOrder) {
//       return res.status(404).send({ error: 'Order not found' });
//     }

//     // Fetch the user by ID
//     const userId = canceledOrder.user._id;
//     const user = await userModel.findById(userId);

//     if (!user) {
//       return res.status(404).send({ error: 'User not found' });
//     }
//     const transactionType = 'credit';

//     user.wallet.balance += canceledOrder.totalAmount;
    
//     const cancelID = canceledOrder._id.toString(); // Convert ObjectId to string
//     // Push a new transaction to the wallet.transactions array
//     user.wallet.transactions.push({
//       ID: cancelID,
//       type: transactionType,
//       amount: canceledOrder.totalAmount,
//     });

//     await user.save();
//     res.redirect('/myorders');
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ error: 'Internal Server Error' });
//   }
// };


const cancelOrder = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    // Find the order by ID and update the orderStatus to 'cancelled'
    const canceledOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { $set: { orderStatus: 'cancelled' } },
      { new: true }
    );

    if (!canceledOrder) {
      return res.status(404).send({ error: 'Order not found' });
    }

    // Extract product IDs and quantities from the canceled order
    const productUpdates = canceledOrder.items.map((orderItem) => ({
      productId: orderItem.product,
      quantity: orderItem.quantity,
    }));

    // Update product stock directly in the database for all products
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
      return res.status(404).send({ error: 'User not found' });
    }

    const transactionType = 'credit';

    user.wallet.balance += canceledOrder.totalAmount;

    const cancelID = canceledOrder._id.toString(); // Convert ObjectId to string
    // Push  new transaction to the wallet.transactions arr
    user.wallet.transactions.push({
      ID: cancelID,
      type: transactionType,
      amount: canceledOrder.totalAmount,
    });

    await user.save();
    res.redirect('/myorders');
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};















// const editOrderDetails = async (req, res) => {
//   try {
//     const orderId = req.params.id;
//     const action = req.query.action;
//     console.log(orderId);

//     const order = await orderModel
//       .findById(orderId)
//       .populate('user items.product');
//     const orderStatus = await orderModel
//       .findById(orderId)
//       .populate('orderStatus');

//     if (action === 'cancel') {
//       // Assuming you have a function to update order details based on cancellations
//       await updateOrderDetailsAfterCancellation(orderId);

//       // Update the order status to 'Cancelled'
//       await orderModel.findByIdAndUpdate(orderId, { orderStatus: 'Cancelled' });
//     }
//     // else if (action === 'return') {
//     //   await orderModel.findByIdAndUpdate(orderId, { orderStatus: "Returned" });
//     // }

//     res.render('users/userOrderDetails', { order, orderStatus });
//   } catch (error) {
//     console.log(error.message);
//   }
// };


// const cancelProduct = async (req, res) => {
//   console.log('enterd in the function cancel')
//   const orderId = req.params.orderId;
//   const productIdToCancel = req.params.productId;
  

//   // Validate productIdToCancel
//   if (!mongoose.Types.ObjectId.isValid(productIdToCancel)) {
//     return res.status(400).send({ error: 'Invalid productIdToCancel' });
//   }

//   try {
//     // Find the order by ID
//     const order = await orderModel.findById(orderId);

//     console.log('Order:', order);

//     if (!order) {
//       return res.status(404).send({ error: 'Order not found' });
//     }

//     // Check if the order is already cancelled
//     if (order.orderStatus === 'cancelled') {
//       return res.status(400).send({ error: 'Order is already cancelled' });
//     }

//     // Ensure that the items array exists in the order
//     if (!order.items || !Array.isArray(order.items)) {
//       return res.status(400).send({ error: 'No items found in the order' });
//     }

//     console.log('Items:', order.items);

//     // Find the item to cancel in the order's items array
//     const itemToCancel = order.items.find(item =>
//       item._id.equals(mongoose.Types.ObjectId(productIdToCancel))
//     );

//     console.log('Item to Cancel:', itemToCancel);

//     if (!itemToCancel) {
//       return res.status(404).send({ error: 'Item not found in the order' });
//     }

//     // Update the trackOrder status to 'Cancelled' for the specific item
//     itemToCancel.trackOrder = 'Cancelled';

//     // Fetch the user by ID
//     const userId = order.user._id;
//     const user = await userModel.findById(userId);

//     if (!user) {
//       return res.status(404).send({ error: 'User not found' });
//     }

//     // Add the cancelled item's total price to the user's wallet
//     const transactionType = 'credit';
//     user.wallet.balance += itemToCancel.totalPrice;

//     // Add a new transaction to the wallet
//     user.wallet.transactions.push({
//       ID: itemToCancel._id,
//       type: transactionType,
//       amount: itemToCancel.totalPrice,
//     });

//     // Save changes to the database
//     await Promise.all([order.save(), user.save()]);

//     res.redirect('/myorders',{productId});
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ error: 'Internal Server Error' });
//   }
// };



// const returnedOrder = await orderModel.findByIdAndUpdate(

//   orderId,
//   { $set: { orderStatus: 'Returned' } },
//   { new: true }
// );
// try{

// if (!returnedOrder) {
//   return res.status(404).send({ error: 'Order not found' });
// }

// // Perform additional logic for crediting payment, if needed
// const userId = returnedOrder.user._id;
// const user = await userModel.findById(userId);

// if (!user) {
//   return res.status(404).send({ error: 'User not found' });
// }

// const transactionType = 'credit';

// // Assuming you have a function to calculate the refund amount
// const refundAmount = calculateRefundAmount(returnedOrder.items);

// user.wallet.balance += refundAmount;

// const returnID = returnedOrder._id.toString(); // Convert ObjectId to string
// // Push a new transaction to the wallet.transactions array
// user.wallet.transactions.push({
//   ID: returnID,
//   type: transactionType,
//   amount: refundAmount,
// });

// await user.save();

// res.status(200).json({ success: true, message: 'Order returned successfully' });
// } catch (error) {
// console.error(error);
// res.status(500).json({ success: false, message: 'Internal Server Error' });
// }


const returnedOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId
    const returnOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { $set: { orderStatus: 'Returned' } },
      { new: true }
    );
    console.log('')
    console.log('inside return order function')

    if (!returnOrder) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    
    res.json({ success: true });
  } catch (error) {
    console.error('Error returning order:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};











const placeOrder = async(req,res)=>{
  try{

    console.log("hiiii hlooo checkout ",req.body)

  }catch(err){
    console.log(err)

  }
}
//  ----------------Razorpay-------------------

const userPayment = async(req,res)=>{
  try{
    const category = await categoryModel.find();
    const { oid:orderId } = req.query;
    const order = orderModel.findById(orderId);
    console.log(' in userPayment',order);
    if(order.orderStatus === "ordered"){
      res.render("users/userPayment",{
        category,
        order,
        razorpay_key : process.env.RAZORPAY_KEY_ID,
      });
    }


  }catch(err){
    console.log(err.message);
  }
}

const checkPayment = async(req,res)=>{
  const userId = req.session.user_id;
  const { razorpayOrderId,razorpayPaymentId,secret } = req.body;
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(razorpayOrderId + "|"+ razorpayPaymentId);
  let generatedSignature = hmac.digest("hex");
  if(generatedSignature == secret){
    await orderModel.findOneAndUpdate(
      { "paymentDatas.id":razorpayOrderId },
      { orderStatus: "placed"}
    );
    await cartModel.findOneAndUpdate( { user:userId },{ products:[] });
    res.status(200).json({ success:true });
  }else{
    res.status(400).json({ success:false });
  }

}





const adminOrderLists = async (req, res) => {
  try {
    const ITEMS_PER_PAGE = 10;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;
    const totalCount = await orderModel.countDocuments();
        const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
        
    const orders = await orderModel
      .find({})
      .populate('user', 'name email') 
      .populate({ path: 'items.product', select: 'name price' })
      .sort({createdAt:-1})  
      .skip(skipItems)
      .limit(ITEMS_PER_PAGE);


    res.render("admin/adminOrderLists", { orders, currentPage: page, totalPages: totalPages });
  } catch (error) {
    console.log(error.message);
  }
};




const adminEditOrderLists = async (req, res) => {
  try { 
    console.log('In adminEditOrderLists page');
    const orderId = req.query._id;
    const order = await orderModel.findById(orderId).populate('user items.product');

    // Populate  user.address field
    await order.populate({
      path: 'user.address',
      model: 'users',
    });

    res.render('admin/adminOrderDetail', { order });
  } catch (error) {
    console.log(error.message);
  }
};



const adminEditOrderListPost = async (req, res) => {
try { 
  const orderId = req.body.id;
  const orderStatus = req.body.status;
  console.log(orderStatus)
  await orderModel.findByIdAndUpdate(orderId, {orderStatus: orderStatus });
  res.redirect("/admin/adminorderlists");
} catch (error) {
  console.log(error.message);
}
}

module.exports = {
  // userOrderConfirmation,
  orderlist,
  adminOrderLists,
  adminEditOrderLists,
  adminEditOrderListPost,
  orderDetail,
  placeOrder,
  editOrderDetails,
  //editOrderDetails,
  //orders,
  userPayment,
  checkPayment,
  cancelOrder,
  returnedOrder,
  // updateProductAfterCancel,
  

}

