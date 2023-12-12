const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    productname: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
    },
    categoryname: {
        type: mongoose.Schema.ObjectId,
        ref: 'categories',
        required: true,
    },
    mrp: {
        type: Number,
        required: true,
        min: 0,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    stock: {
        type: Number,
        required: true,
        maxlength: [10,'stock cannot exceed limit'],
        default: 1,
        min: 0,
    },
    image: [{ type: Array,required: true }],
    avgRating: {
        type: Number,
        default: 4.3,
    },
    numOfReviews: {
        type: Number,
        deafult: 12,

    },
   
 status: {
    type: String,
    enum: ['Listed', 'Delisted'],
    required: true,
    default: 'Listed'
 }

});

module.exports = mongoose.model('products', productSchema, 'products');