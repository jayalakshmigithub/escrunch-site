const Razorpay = require("razorpay");
let razorpayInstance = null;

function createRazorpayInstance() {
    
    
    return razorpayInstance;
}

module.exports = createRazorpayInstance;





// if (!razorpayInstance) {
//     console.log("Creating a new Razorpay instance");
//     razorpayInstance = new Razorpay({
//         key_id: process.env.RAZORPAY_KEY_ID, // Use "key_id" instead of "key"
       
//         key_secret: process.env.RAZORPAY_KEY_SECRET,
//     });
//     console.log('key_id razorpay',process.env.RAZORPAY_KEY_ID)
//     console.log('secretkey',process.env.RAZORPAY_KEY_SECRET)
// }








// const Razorpay = require("razorpay");
// let razorpayInstance = null
// function createRazorpayInstance(){
//     if(!razorpayInstance){
//         console.log("Creating a new Razorpay instance");
//         razorpayInstance = new Razorpay({
           
//             key_id: process.env.RAZORPAY_KEY_ID,
//             key_secret: process.env.RAZORPAY_KEY_SECRET,
//         })
//     }
//     return razorpayInstance
// }
// module.exports = createRazorpayInstance;

// const Razorpay = require("razorpay");
// let razorpayInstance = null;

// function createRazorpayInstance(){
//     if(!razorpayInstance){
//         razorpayInstance = new Razorpay({
//             key_id: process.env.RAZORPAY_KEY_ID,
//             key_secret: process.env.RAZORPAY_KEY_SECRET,
//         })
//     }
//     return razorpayInstance
// }

// module.exports = createRazorpayInstance;
