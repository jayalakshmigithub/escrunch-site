const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
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
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "users",
  },
  
});

module.exports = mongoose.model("address", addressSchema);
