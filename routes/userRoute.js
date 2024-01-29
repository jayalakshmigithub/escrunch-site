const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const productController = require("../controller/productController");
const cartController = require("../controller/cartController");
const orderController = require("../controller/orderController");
const auth = require("../middleware/authmiddleware");
const cropImage = require("../multer/productImageCrop");

const { userLandingPage, userLogin, userSignup, viewOtpPage } = userController;

router.get("/", userLandingPage); //Render the landing page
router.get("/login", userLogin); //Render the login page
router.get("/signup", userSignup); //Render the signup page
router.post("/signup", userController.insertUser); //Inserting a new user into your database
router.get("/verify/:mobile", viewOtpPage); //Render otpvalidation page

router.post("/sendotp", userController.userSendOtp); //To send Otp
router.get("/otpValidation", userController.viewOtpPage); //Render otpvalidation page
router.post("/otpVerification", userController.otpVerificaton); //Verify Otp

router.get("/login", userController.loginLoad);
router.post("/login", userController.verifyLogin);
router.get("/logout", auth.isLogin, userController.userLogout);
router.get(
  "/home",
  auth.isHomeAuthenticated,
  auth.isLogin,
  userController.userHome
); //Render home page


router.get("/productdetails/:id", userController.userProductDetails); //show single product details
router.get("/products", auth.isLogin, userController.userProductLists);//show products list for filter
router.get('/search',auth.isLogin,userController.userSearch); // to search product
router.get("/categoryproducts/:id", auth.isLogin, userController.userCategory); //show product based on category
router.get("/sortedproducts", auth.isLogin, userController.userSortPrice); //show products based on price

router.get("/cart", auth.isLogin, cartController.userCart); //Render user cart
router.post("/addtocart", auth.isLogin, cartController.addtocartpost); // Add product to cart
router.get(
  "/cart/:cartId/product/:productId",
  auth.isLogin,
  cartController.removeFromCart
); //Remove product from cart
router.post("/updatecart", auth.isLogin, cartController.updateCart); // to update cart

router.get("/userprofile", auth.isLogin, userController.userProfile); //Render user Profile
router.get("/changepassword", auth.isLogin, userController.changePassword); // Change old password
router.put("/changepassword", auth.isLogin, userController.updatePassword); // update password after changing
router.post(
  "/userprofile",
  auth.validatePhoneNumber,
  auth.isLogin,
  userController.userProfileUpdated
); // Update user profile

router.get("/addaddress", auth.isLogin, userController.userAddress); //Render add address page
router.post("/addaddress", auth.isLogin, userController.userAddAddressPost); //Add new address
router.get("/removeaddress", auth.isLogin, userController.removeAddress); //Remove address

router.get(
  "/editaddress/:addressId",
  auth.isLogin,
  userController.userEditAddress
); //Render edit address page
router.post("/editaddress", auth.isLogin, userController.userUpdatedAddress); //Update address

router.get("/checkout:id?", auth.isLogin, cartController.userCheckOut); //Render checkout page
router.post("/checkoutpost", auth.isLogin, cartController.userCheckoutPost); //Process checkout

router.get("/orders/payment", orderController.userPayment); //Render payment page
router.post("/orders/check-payment", orderController.checkPayment); //check payment status
router.get("/wallet", auth.isLogin, userController.userWallet); //Render wallet page
router.post("/verifypayment"); //verify payment

router.get("/usecoupon", userController.userAddCoupon); // Render use coupon page
router.post("/addcoupon", userController.userAddCouponpost); // Add coupon during checkout
router.post("/checkoutpost", cartController.userCheckoutPost); // Process checkout
router.post("/updateProductAfterOrder", cartController.updateProductAfterOrder); // Function to update product quantity and stock after placing an order

router.get("/orderdetails/:orderId", auth.isLogin, orderController.orderDetail); //Render order details page
router.post("/orderlist", auth.isLogin, orderController.orderlist);
router.get("/myorders", auth.isLogin, orderController.orderlist); //show list of orders
router.get("/editorderdetails/:id", orderController.editOrderDetails); //Render edit order details page
router.get("/cancelorder/:orderId", orderController.cancelOrder); //to cancel order
router.post("/returnedOrder/:orderId", orderController.returnedOrder); // to return order
router.get("/contact", userController.contactUsController); // Render contact us page

module.exports = router;
