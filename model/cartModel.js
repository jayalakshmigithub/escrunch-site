const  mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.ObjectId,
        ref:'users',
        required: true,
    },
    products:[
        {
            product:{
                type:mongoose.Schema.ObjectId,
                //ref:'product',
                ref:'products',
                required: true,
            },
            quantity: {
                type: Number,
                default: 1,
                min: 1,
            },
            price:{
                type:Number,
            },
            totalPrice:{
                type:Number,
            }
        },
    ]

});

module.exports = mongoose.model('carts',cartSchema,'carts');