const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "users",
  },
  items: [
    {
      product: {
        type: mongoose.Schema.ObjectId,
        ref: "products",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
      trackOrder: {
        type: String,
        enum: [
          "Ordered",
          "pending",
          "Delivered",
          "placed",
          "Cancelled",
          "Returned",
        ],
        default: "Ordered",
      },
      totalPrice: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
  orderStatus: {
    type: String,
    enum: [
      "ordered",
      "pending",
      "Delivered",
      "placed",
      "Cancelled",
      "Returned",
    ],
    default: "ordered",
  },
  totalAmount: {
    type: Number,

    min: 0,
  },
  paymentMode: {
    type: String,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paymentData: {
    type: Object,
  },
  address: {
    type: mongoose.Schema.ObjectId,
    ref: "users.address",
  },
  coupon: {
    type: mongoose.Schema.ObjectId,
    ref: "Coupon",
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  finalPrice: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// orderSchema.virtual('totalPrice').get(function() {
// 	return this.items.reduce((total, item) => total + item.price * item.quantity, 0);
// });

// orderSchema.pre('save', async function (next) {
// 	let total = 0
// 	for (let item of this.items) {
// 		total += item.price * item.quantity
// 	}
// 	this.totalAmount = total
// 	this.finalPrice = total- this.discountAmount
// 	next()
// })

module.exports = mongoose.model("orders", orderSchema);
