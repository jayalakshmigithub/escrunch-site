const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: String, // Change the type to String
    unique: true, // Add unique option
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    required: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  address: [
    {
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: Number,
        required: true,
      },
      mobile: {
        type: String,
      },
    },
  ],
  status: {
    type: Boolean,
    default: true,
  },
  wallet: {
    balance: {
      type: Number,
      default: 0,
    },
    transactions: [
      {
        ID: {
          type: String,
          required: true,

        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: ['credit', 'debit'],
        },

        amount: {
          type: Number,
          required: true,
        },
      },
    ],
  },
});

module.exports = mongoose.model("users", userSchema);
