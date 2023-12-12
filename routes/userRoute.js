const express = require("express")
const router = express.Router();
const userController = require("../controller/userController");
const productController = require('../controller/productController');
const cartController = require('../controller/cartController');
const orderController = require('../controller/orderController');
const auth = require('../middleware/authmiddleware');
const cropImage = require('../multer/productImageCrop');

const { userLandingPage, userLogin, userSignup, otpVerificaton, viewOtpPage } = userController;


//define route to render the userLogin.ejs file
router.get('/', userLandingPage);
router.get('/login', userLogin);
router.get('/signup', userSignup);
router.post('/signup', userController.insertUser);
router.get('/verify/:mobile', viewOtpPage);



router.post('/sendotp', userController.userSendOtp);
router.get('/otpValidation', userController.viewOtpPage); 
router.post('/otpVerification', userController.otpVerificaton);

router.get('/login',userController.loginLoad);
router.post('/login', userController.verifyLogin);
router.get('/logout',auth.isLogin,userController.userLogout);
router.get('/home',auth.isLogin,userController.userHome)
router.get('/productdetails/:id',  userController.userProductDetails);
router.get('/products',auth.isLogin,userController.userProductLists);
router.get('/categoryproducts/:id',auth.isLogin,userController.userCategory);
router.get('/sortedproducts',auth.isLogin,userController.userSortPrice);


router.get('/cart',auth.isLogin,cartController.userCart);
router.post('/addtocart',auth.isLogin,cartController.addtocartpost);
router.get('/cart/:cartId/product/:productId',auth.isLogin,cartController.removeFromCart);
router.post('/updatecart',auth.isLogin,cartController.updateCart);

router.get('/userprofile', auth.isLogin, userController.userProfile);
router.get('/changepassword',auth.isLogin,userController.changePassword);
router.put('/changepassword',auth.isLogin,userController.updatePassword);
router.post('/userprofile',auth.validatePhoneNumber, auth.isLogin, userController.userProfileUpdated);

router.get('/addaddress',auth.isLogin,userController.userAddress);
router.post('/addaddress',auth.isLogin,userController.userAddAddressPost);
router.get('/removeaddress',auth.isLogin,userController.removeAddress);

router.get('/editaddress/:addressId', auth.isLogin, userController.userEditAddress);
router.post('/editaddress', auth.isLogin, userController.userUpdatedAddress);

router.get('/checkout:id?',auth.isLogin,cartController.userCheckOut);
router.post('/checkoutpost',auth.isLogin,cartController.userCheckoutPost);

router.get('/orders/payment',orderController.userPayment);
router.post('/orders/check-payment',orderController.checkPayment);
// router.get('/orderdetails/:id', orderController.userOrderConfirmation);
router.get('/wallet',auth.isLogin,userController.userWallet);

router.post('/verifypayment')


router.get('/usecoupon', userController.userAddCoupon); // Render use coupon page
router.post('/addcoupon', userController.userAddCouponpost); // Add coupon during checkout
router.post('/checkoutpost', cartController.userCheckoutPost); // Process checkout
router.post('/updateProductAfterOrder',cartController.updateProductAfterOrder);// Function to update product quantity and stock after placing an order


router.get('/orderdetails/:orderId', auth.isLogin, orderController.orderDetail);
router.post('/orderlist',auth.isLogin,orderController.orderlist);
router.get('/myorders',auth.isLogin,orderController.orderlist);
router.get('/editorderdetails/:id', orderController.editOrderDetails);
router.get('/cancelorder/:orderId', orderController.cancelOrder);
router.post('/returnedOrder/:orderId', orderController.returnedOrder);
router.get('/contact',userController.contactUsController);





module.exports = router;