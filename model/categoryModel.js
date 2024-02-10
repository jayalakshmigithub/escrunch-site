const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema({
  categoryname: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  listed: {
    type: Boolean,
    default: true,
  },
  image: {
    type: String,
    default: false,
  },
});
const category = mongoose.model("categories", categorySchema);
module.exports = category;
