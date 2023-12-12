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



//<------------admin login------------->
// router.get('/',(req,res)=>{
//   console.log(__dirname);
//   res.render('./admin/adminLogin')
// })
adminRoute.get('/login',adminController.adminLogin);
adminRoute.post('/login',adminController.verifyAdmin);
//adminRoute.get('logout',auth.isAdminAuthorized,adminController.adminLogout);
adminRoute.get('/adminhome',auth.isAdminAuthorized,adminController.adminHome);

adminRoute.get('/userslist',auth.isAdminAuthorized,adminController.adminUsersList);
adminRoute.post('/blockunblock',auth.isAdminAuthorized,adminController.adminBlockUnblock);

adminRoute.get('/adminCategory',auth.isAdminAuthorized, categoryController.adminCategory);//To display the category list page for admin
adminRoute.get('/adminaddCategory',auth.isAdminAuthorized, categoryController.adminAddCategoryPage);//to render add category page of admin
adminRoute.post('/adminaddCategory',auth.isAdminAuthorized, categoryController.adminAddCategory);//to add category to db by admin
adminRoute.get('/admineditCategory',auth.isAdminAuthorized, categoryController.adminEditCategoryPage);//to edit category page of admin
 adminRoute.post('/admineditCategory',auth.isAdminAuthorized, categoryController.adminEditCategory);//To edit category by admin
adminRoute.get('/admindeleteCategory',auth.isAdminAuthorized, categoryController.deleteCategory);//to delete categroy by admin

adminRoute.get('/adminproducts',auth.isAdminAuthorized, productController.adminProducts);
adminRoute.get('/addproduct',auth.isAdminAuthorized, productController.adminAddProductPage);
 adminRoute.post('/addproduct',auth.isAdminAuthorized, productUpload.array('file'), productController.adminAddProduct);
adminRoute.get('/editproduct',auth.isAdminAuthorized, productController.adminEditProductPage);
 adminRoute.post('/editproduct',auth.isAdminAuthorized, productUpload.array('file'), productController.adminEditProduct);
adminRoute.post('/removeimages',auth.isAdminAuthorized, productController.adminDeleteImage);

adminRoute.get('/adminorderlists', auth.isAdminAuthorized, orderController.adminOrderLists);
adminRoute.get('/order/edit',auth.isAdminAuthorized,orderController.adminEditOrderLists);
adminRoute.post('/admineditorder',auth.isAdminAuthorized,orderController.adminEditOrderListPost);

adminRoute.get('/coupons', couponController.adminCoupons); // Display coupon list
adminRoute.get('/addcoupon', couponController.adminAddCoupon); // Display coupon add page
adminRoute.post('/addcoupon', couponController.adminAddCouponPost); // Add a new coupon
adminRoute.get('/coupon/edit', couponController.adminEditCoupon); // Display coupon edit page
adminRoute.post('/editcoupon', couponController.adminEditCouponPost); // Edit a coupon
adminRoute.get('/deletecoupon', couponController.deleteCoupon);

adminRoute.get('/list-product/:productId', productController.listProduct);
adminRoute.get('/unlist-product/:productId', productController.unlistProduct);

adminRoute.put('/updateStatus',auth.isAdminAuthorized,userController.updateStatus);

adminRoute.get('/salesreport',auth.isAdminAuthorized,adminController.salesreport);

adminRoute.get('/reports/sales/download/:type',auth.isAdminAuthorized,adminController.adminDownloadReports);


module.exports=adminRoute;