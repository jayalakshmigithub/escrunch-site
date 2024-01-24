const express = require("express");
const auth = require('../middleware/authmiddleware');
const adminRoute = express.Router();

const adminController = require('../controller/adminController');
const categoryController = require('../controller/categoryController');
const productController = require('../controller/productController');
const productUpload = require('../multer/product');
const orderController = require('../controller/orderController');
const userController = require("../controller/userController");
const couponController = require("../controller/couponController");

adminRoute.get('/login',adminController.adminLogin);//Render admin login
adminRoute.post('/login',adminController.verifyAdmin);//check it is admin
//adminRoute.get('logout',auth.isAdminAuthorized,adminController.adminLogout);
adminRoute.get('/adminhome',auth.isAdminAuthorized,adminController.adminHome);//Render admin home page

adminRoute.get('/userslist',auth.isAdminAuthorized,adminController.adminUsersList);//Render user's list
adminRoute.post('/blockunblock',auth.isAdminAuthorized,adminController.adminBlockUnblock);//To block and unblock users

adminRoute.get('/adminCategory',auth.isAdminAuthorized, categoryController.adminCategory);//To display the category list page for admin
adminRoute.get('/adminaddCategory',auth.isAdminAuthorized, categoryController.adminAddCategoryPage);//To render add category page of admin
adminRoute.post('/adminaddCategory',auth.isAdminAuthorized, categoryController.adminAddCategory);//To add category to db by admin
adminRoute.get('/admineditCategory',auth.isAdminAuthorized, categoryController.adminEditCategoryPage);//To edit category page of admin
 adminRoute.post('/admineditCategory',auth.isAdminAuthorized, categoryController.adminEditCategory);//To edit category by admin
adminRoute.get('/admindeleteCategory',auth.isAdminAuthorized, categoryController.deleteCategory);//To delete categroy by admin

adminRoute.get('/adminproducts',auth.isAdminAuthorized, productController.adminProducts);//Render list of products page
adminRoute.get('/addproduct',auth.isAdminAuthorized, productController.adminAddProductPage);// Render add product page
 adminRoute.post('/addproduct',auth.isAdminAuthorized, productUpload.array('file'), productController.adminAddProduct);//To add new product
adminRoute.get('/editproduct',auth.isAdminAuthorized, productController.adminEditProductPage);//Render edit product page
 adminRoute.post('/editproduct',auth.isAdminAuthorized, productUpload.array('file'), productController.adminEditProduct);//To edit product
adminRoute.post('/removeimages',auth.isAdminAuthorized, productController.adminDeleteImage);//Delete images of product

adminRoute.get('/adminorderlists', auth.isAdminAuthorized, orderController.adminOrderLists);//Render order list page
adminRoute.get('/order/edit',auth.isAdminAuthorized,orderController.adminEditOrderLists);//To edit order list
adminRoute.post('/admineditorder',auth.isAdminAuthorized,orderController.adminEditOrderListPost);//process 

adminRoute.get('/coupons', couponController.adminCoupons); // Display coupon list
adminRoute.get('/addcoupon', couponController.adminAddCoupon); // Display coupon add page
adminRoute.post('/addcoupon', couponController.adminAddCouponPost); // Add a new coupon
adminRoute.get('/coupon/edit', couponController.adminEditCoupon); // Display coupon edit page
adminRoute.post('/editcoupon', couponController.adminEditCouponPost); // Edit a coupon
adminRoute.get('/deletecoupon', couponController.deleteCoupon);//To delete coupon

adminRoute.get('/list-product/:productId', productController.listProduct);// To show/list the products
adminRoute.get('/unlist-product/:productId', productController.unlistProduct);//To remove/unlist the products

adminRoute.put('/updateStatus',auth.isAdminAuthorized,userController.updateStatus);//To update the order status
adminRoute.get('/salesreport',auth.isAdminAuthorized,adminController.salesreport);//To generate sales report
adminRoute.get('/reports/sales/download/:type',auth.isAdminAuthorized,adminController.adminDownloadReports);//To download sales report


adminRoute.get('/bannerlist',auth.isAdminAuthorized, adminController.adminBannerList); // Display banner list
adminRoute.get('/addbanner',auth.isAdminAuthorized, adminController.adminAddbanner); // Display banner add page
adminRoute.post('/addbanner',productUpload.single('images'),auth. setCacheControl, auth.isAdminAuthorized, adminController.adminAddedBanner); // Add a new banner
adminRoute.get('/banner/edit',auth.isAdminAuthorized, adminController.adminEditBanner); // Display banner edit page
adminRoute.post('/editbanner',productUpload.single('images'), auth.isAdminAuthorized, adminController.adminEditedBanner); // Edit a banner
adminRoute.get('/deletebanner',auth.isAdminAuthorized, adminController.deleteBanner); // Delete a banner

module.exports=adminRoute;