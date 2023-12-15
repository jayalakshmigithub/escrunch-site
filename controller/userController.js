const userModel = require("../model/userModel");
const otpVerificationHelper = require("../helper/otpVerificationHelper");
const bcrypt = require("bcrypt");
const productModel = require("../model/productModel");
const categoryModel = require("../model/categoryModel");
const wishlistModel = require('../model/wishlistModel');
const couponModel = require("../model/couponModel");
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
const session = require("express-session");
const mongoose = require("mongoose");
const cacheControl = require("../middleware/cacheControlMiddleware");
const cropImage = require('../multer/productImageCrop');
const product = require('../multer/product');
const catImgCrop = require('../multer/catImgCrop');




//<------------------ Password Hashing --------------------->
async function hashPassword(plainPassword) {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    return hashedPassword;
  } catch (err) {
    console.error(err.message);
    throw err;
  }
}

const userSendOtp = async (req, res) => {
  try {
    console.log("In SendOtp function");
    const phone = "+91" + req.body.phonenumber;

    otpVerificationHelper.sendotp(phone, (status) => {
      //otp for twilio
      if (status === "pending") {
        res.json({ status: "OTP_SEND" });
        console.log(
          "Otp sent,, now in userSendOtp Controller function- otpVerificationHelper.sendotp(phone, (status) functional block"
        );
      } else res.json({ status: "ERROR_SENDING_OTP" });
    });
  } catch (error) {
    console.log(error.message);
  }
};

//usersignup------------------------
//signup user verify------------------------
const userSignup = async (req, res) => {
  try {
    res.render("users/userSignup");
  } catch (error) {
    console.log(error.message);
  }
};


const insertUser = async (req, res) => {
  try {
    const hashedPassword = await hashPassword(req.body.password);
    const usermodel = new userModel({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: hashedPassword,
      isVerified: true,
    });

    const count = await userModel.find({ mobile: req.body.mobile });

    const result = await usermodel.save();
    if (result) {
      await sendOTP(req.body.mobile);
      res.render("users/otpValidation", { mobile: req.body.mobile });
    } else {
      res.render("users/userSignup");
    }
  } catch (err) {
    console.log(err.message);
  }
};

const sendOTP = async (mobileNumber) => {
  await client.verify.v2
    .services(process.env.VERIFY_SID)
    .verifications.create({ to: `+91${mobileNumber}`, channel: "whatsapp" })
    .then((verification) => console.log(verification.accountSid));
};

const userLandingPage = async (req, res) => {
  try {
    let products = await productModel.find();
    let category = await categoryModel.find();
    res.render("users/userLandingPage", { products: products });
  } catch (err) {
    console.log(err.message);
  }
};
const userLogin = async (req, res) => {
  try {
    if (req.session.user_id) res.redirect("/home");
    //if(req.session.user) res.redirect('/userLandingPage')
    else res.render("users/userLogin", { err: "user not found" });
  } catch (err) {
    console.log(err.message);
  }
};
const userLogout = async (req, res) => {
  try {
    // Destroy the session to log the user out
    req.session.destroy();
    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
};

//verify to login to the page

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    console.log("Email:", email);
    console.log("Password:", password);

    const userData = await userModel.findOne({ email: email });
    console.log("User Data:", userData);

    if (userData) {
      if (!userData.isVerified) {
        res.render("users/userLogin", { msg: "user not verified" });
      }
      if(userData.isBlocked){
        res.render("users/userLogin", { msg: "user is blocked" });
      }
      const passwordMatch = await bcrypt.compare(password, userData.password);
      console.log("Password Match:", passwordMatch);

      if (passwordMatch) {
        req.session.user_id = userData;
        console.log(req.session.user_id);
        res.redirect("/home");
      } else {
        res.render("users/userLogin", {
          msg: "email or password is incorrect",
        });
      }
    } else {
      res.render("users/userLogin"); //{msg:"email or password is incorrect"}
    }
  } catch (error) {
    console.log(error.message);
    res.render("users/userLogin", {
      msg: "An error occurred. Please try again later.",
    });
  }
};
//login user methods started

const loginLoad = async (req, res) => {
  try {
    if (req.session.user_id) {
      console.log("hah", req.session.user_id);
      res.redirect("/home");
    } else {
      res.render("users/userLogin");
    }
  } catch (err) {
    console.log(err.message);
  }
};

const otpVerificaton = async (req, res) => {
  try {
    const otp = req.body.OTP;
    const mobile = req.body.mobileNumber;

    const verificationCheck = await client.verify
      .services(process.env.VERIFY_SID)
      .verificationChecks.create({
        to: `+91${mobile}`,
        code: otp,
      });

    console.log(verificationCheck);

    if (verificationCheck.status === "approved") {
      await userModel.updateOne(
        { mobile: mobile },
        { $set: { isVerified: true } }
      );

      console.log("Verified");
      res.redirect("/login");
    } else {
      res.redirect("/otpVerification");
    }
  } catch (error) {
    console.error(error);

  }
};



const viewOtpPage = async (req, res) => {
  try {
    res.status(200).render("./users/otpValidation");
  } catch (error) {
    console.log(error);
    res.status(404).send("Page not found", error);
  }
};

const userHome = async (req, res) => {
  try {
    let products = await productModel.find({status:'Listed'});
    res.render("users/userHome", { products });
    // res.setHeader('Cache-Control','no-cache, no-store, must-revalidate')
    // res.setHeader('Pragma','no-cache')
    // res.setHeader('Expires','0')
  } catch (err) {
    res.send(err);
    console.log(err.message);
  }
};

const userProductLists = async (req, res) => {
  try {
    console.log('enterd in this productlist')
    const results = await productModel.aggregate([
      {
        $group: {
          _id: "$categoryname",
          count: { $sum: 1 },
        },
      },
    ]);
    console.log('results in product list',results)
    const categoriesWithCounts = await Promise.all(
      results.map(async (result) => {
        const category = await categoryModel.findOne({
          categoryname: result._id,
        });

        return {
          categoryid: result._id,
          count: result.count,
        };
      })
    );

    for (const categoryinfo of categoriesWithCounts) {
      // Find the product with the given ObjectId
      const product = await productModel
        .findOne({ categoryname: categoryinfo.categoryid })
        .populate("categoryname")
        .exec();

      if (product && product.categoryname) {
        const categoryName = product.categoryname.categoryname;
        categoryinfo.catname = categoryName;
      }
    }

    const ITEMS_PER_PAGE = 3;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;
    const totalCount = await productModel.countDocuments();
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const products = await productModel
      .find()
      .populate("categoryname")
      .skip(skipItems)
      .limit(ITEMS_PER_PAGE);

    if (products)
      res.render("users/userProductLists", { products,currentPage: page,totalPages: totalPages,category: categoriesWithCounts,  sortOption: req.query.sortOption || '1'});
  } catch (error) {
    console.log(error.message);
  }
};

const userCategory = async (req, res) => {
  try {
    const catId = req.params.id;
    const category = await categoryModel.findOne({ _id: catId })
    const categoryname = category.categoryname
    const products = await productModel.find({ categoryname: catId }).populate("categoryname")

    const ITEMS_PER_PAGE = 3;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;
    const totalCount = 9;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const prods = await productModel
      .find()
      .populate("categoryname")
      .skip(skipItems)
      .limit(ITEMS_PER_PAGE);
      console.log('prods in category',prods)

    if (prods)
      res.render("users/userCategory", {products,currentPage: page,totalPages: totalPages,catId,categoryname});

  } catch (error) {
    console.log(error.message);
  }
};

// const userSortPrice = async (req, res) => {
//   try {
//     console.log('enterd in sortprice')
//     const results = await productModel.aggregate([
//       {
//         $group: {
//           _id: "$categoryname", // Group by category name
//           count: { $sum: 1 }, // Count the number of products in each group
//         },
//       },
//     ]);
//     console.log('result in sorprice',results);

//     const categoriesWithCounts = await Promise.all(
//       results.map(async (result) => {
//         const category = await categoryModel.findOne({
//           categoryname: result._id,
//         });

//         return {
//           categoryid: result._id,
//           count: result.count,
//         };
//       })
//     );

//     for (const categoryinfo of categoriesWithCounts) {
//       // Find the product with the given ObjectId
//       const product = await productModel
//         .findOne({ categoryname: categoryinfo.categoryid })
//         .populate("categoryname")
//         .exec();

//       if (product && product.categoryname) {
//         const categoryName = product.categoryname.categoryname;
//         categoryinfo.catname = categoryName;
//       }
//     }
//     const { sortOption } = req.query;
//     let sortCriteria = {};
//     if (sortOption === '2') {
//       sortCriteria = { price: 1 };      // Sort by Price: Low to High
//     } else if (sortOption === '3') {
//       sortCriteria = { price: -1 };    // Sort by Price: High to Low
//     }


//     const ITEMS_PER_PAGE = 3;
//     const page = parseInt(req.query.page) || 1;
//     const skipItems = (page - 1) * ITEMS_PER_PAGE;
//     const totalCount = await productModel.countDocuments();
//     const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

//     const sortedProducts = await productModel.find().populate('categoryname').sort(sortCriteria).skip(skipItems).limit(ITEMS_PER_PAGE);

//     if (sortedProducts)
//       res.render("users/userSortPrice", {
//         products: sortedProducts,
//         currentPage: page,
//         totalPages: totalPages,
//         category: categoriesWithCounts,
//         sortOption,

//         calculateMRP: (product) => {

//           if (product.categoryname.offerPercentage > 0) {
//             return product.price;
//           } else if (product.categoryname.offerPercentage === 0 && product.productOffer > 0) {
//             return product.productOffer;

//           } else {
//             return product.mrp;
//           }
//         },
//       });

//   } catch (error) {
//     console.log(error.message);
//   }
// }

const userSortPrice = async (req, res) => {
  try {
    console.log('entered here in sort');
    const results = await productModel.aggregate([
      {
        $match: { status: 'Listed' } // consider only  'Listed' products
      },
      {
        $group: {
          _id: "$categoryname",
          count: { $sum: 1 },
        },
      },
    ]);
    const sortOptions = req.query.sortOption || '1'; 

    const categoriesWithCounts = await Promise.all(
      results.map(async (result) => {
        const category = await categoryModel.findOne({
          _id: result._id,
        });

        return {
          categoryid: result._id,
          count: result.count,
          catname: category ? category.categoryname : "Unknown Category",
        };
      })
    );

    const { sortOption } = req.query;
    let sortCriteria = {};

    if (sortOption === '2') {
      sortCriteria = { price: 1 }; // Sort by Price: Low to High
    } else if (sortOption === '3') {
      sortCriteria = { price: -1 }; // Sort by Price: High to Low
    }

    const ITEMS_PER_PAGE = 3;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;
    const totalCount = await productModel.countDocuments({ status: 'Listed' });
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const sortedProducts = await productModel
      .find({ status: 'Listed' })
      .populate('categoryname')
      .sort(sortCriteria)
      .skip(skipItems)
      .limit(ITEMS_PER_PAGE);

    if (sortedProducts) {
      res.render("users/userSortPrice", {
        products: sortedProducts,
        currentPage: page,
        totalPages: totalPages,
        category: categoriesWithCounts,
        sortOption:sortOptions,
       

        calculateMRP: (product) => {
          return product.mrp;
        },
      });
    }

  } catch (error) {
    console.log(error.message);
  }
};




const userProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await productModel.findOne({ _id: productId });
    console.log(
      "printing product details, in the userProductDetails controller page::",
      product
    );

    if (!product) {
      return res.status(404).json({ err: "product not found" });
    }
    res.render("users/userProductDetails", { product });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: "internal server error" });
  }
};

const userProfile = async (req, res) => {
  try {
    const category = await categoryModel.find();
    const userId = req.session.user_id;
    const user = await userModel.findById(userId);

    res.render("users/userProfile", { user, category});
  } catch (error) {
    console.log(error.message);
  }
};


// Your route or controller function for changing the password
const changePassword = async (req, res) => {
  try {
    
    // You can directly render the page without any checks or input validation
    res.render('users/changePassword');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};

const updatePassword = async(req,res)=>{
  try{
    const userId = req.session.user_id._id;
    console.log(userId,'hiiii hlooo')
   const userdetails = await userModel.findOne({_id:userId});
   console.log(userdetails)
   console.log(req.body,'req,body')
   const oldPassword = req.body.oldPassword;
   const newPassword = req.body.newPassword;
   const checkPassword = await bcrypt.compare(oldPassword,userdetails.password)
   if(checkPassword){
    const newPass = await bcrypt.hash(newPassword,10);
    await userModel.updateOne({_id:userId},{$set:{password:newPass}})
    res.status(201).json({status:true,message:'password updated successfully'})
   }else{
    res.json({status:false,message:'password does not match'})
   }

  }catch(err){
    console.log(err)
  }
}

const userProfileUpdated = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const name = req.body.name;
    const phonenumber = req.body.phonenumber;

    // if (!phonenumber) {
    //   return res.render("users/userProfile", {
    //     user: req.user,
    //     isUpdated: false,
    //     error: "Phone number is required",
    //   });
    // }



    const user = await userModel.findByIdAndUpdate(
      userId,
      { name, phonenumber },
      { new: true }
    );

    // Set a flag to indicate the update was successful
    const isUpdated = true;

    // Pass the flag and the updated user data to the template
    res.render("users/userProfile", { user, isUpdated });
  } catch (error) {
    console.log(error.message);
  }
};

//   const userAddress = async(req,res) =>{
//     try{
//         const category = await categoryModel.find();
//         const userId = req.session.user_id;
//         const user = await userModel.findById(userId);
//         res.render("users/userAddAddress",{ user,category });
//     }catch(err){
//         console.log(err);
//     }
//   }

//   const userAddressPost = async( req,res ) =>{
//     try{
//     const userId = req.session.user_id;
//     const address = req.body.address;
//     const city = req.body.city;
//     const state = req.body.state;
//     const pincode = req.body.pincode;
//     const user = await userModel.findByIdAndUpdate(
//         userId,
//         {
//             $push :{
//                 address:{
//                     address:address,
//                     city:city,
//                     state:state,
//                     pincode:pincode,

//                 },
//             },
//         },
//         { new :true }
//     )
//     res.render("users/userProfile",{user});
//     }catch(err){
//         console.log(err.message);
//     }

//   }
const userAddress = async (req, res) => {
  try {
    const category = await categoryModel.find();
    const userId = req.session.user_id;
    const user = await userModel.findById(userId);
    res.render("users/userAddAddress", { user, category });
  } catch (error) {
    console.log(error.message);
  }
};

const userAddAddressPost = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const address = req.body.address;
    const city = req.body.city;
    const state = req.body.state;
    const pincode = req.body.pincode;

    if (address && city && state && pincode) {
      // Add address only if all fields are provided
      await userModel.findByIdAndUpdate(
        userId,
        {
          $push: {
            address: {
              address: address,
              city: city,
              state: state,
              pincode: pincode,
            },
          },
        },
        { new: true }
      );
      // res.status(201).json({status:true});
      res.redirect('/userProfile')
    } else {
      // Handle validation errors here
      res.json({status:false})
        }
  } catch (error) {
    console.log(error.message);
  }
};

const userEditAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await userModel.findById(userId);

    // Retrieve the addressId from route parameters
    const addressId = req.params.addressId;

    // Find the specific address in the user's address array by matching _id
    const addressData = user.address.find(
      (address) => address._id.toString() === addressId
    );

    if (!addressData) {
      // Handle the case where the address is not found
      return res.status(404).send("Address not found");
    }

    res.render("users/userEditAddress", {
      user,
      addressId,
      address: addressData.address,
      city: addressData.city,
      state: addressData.state,
      pincode: addressData.pincode,
    });
  } catch (error) {
    console.log(error.message);
  }
};

// const userUpdatedAddress = async (req, res) => {
//   try {
//     const userId = req.session.user_id;
//     const addressId = req.query.addressId;
//     console.log("Address id= req.query.addressId ", addressId);

//     const address = req.body.address;
//     const city = req.body.city;
//     const state = req.body.state;
//     const pincode = req.body.pincode;

//     const user = await userModel.findOneAndUpdate(
//       { _id: userId, "address._id": addressId }, // Match the user and address ID
//       {
//         $set: {
//           "address.$.address": address,
//           "address.$.city": city,
//           "address.$.state": state,
//           "address.$.pincode": pincode,
//         },
//       },
//       { new: true }
//     );

//     res.redirect("/userprofile");
//   } catch (error) {
//     console.log(error.message);
//   }
// };

const userUpdatedAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const addressId = req.query.addressId;
    const address = req.body.address;
    const city = req.body.city;
    const state = req.body.state;
    const pincode = req.body.pincode;

    if (address && city && state && pincode && /^\d{6}$/.test(pincode)) {
      const user = await userModel.findOneAndUpdate(
        { _id: userId, "address._id": addressId },
        {
          $set: {
            "address.$.address": address,
            "address.$.city": city,
            "address.$.state": state,
            "address.$.pincode": pincode,
          },
        },
        { new: true }
      );
      res.redirect("/userprofile");
    } else {
      // Handle validation errors here
      res.status(400).send("Invalid address data");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


const removeAddress = async (req, res) => {
  try {
    const userId = req.session.user_id; // Corrected to match your schema
    const addressIdToRemove = req.query.addressId;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    user.address = user.address.filter(
      (address) => address._id.toString() !== addressIdToRemove
    );

    await user.save();

    res.redirect("/userprofile");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const updateStatus = async(req,res)=>{
  try {
    const userId = req.body.id;
    const status = req.body.status;
    const response = await userModel.updateOne({_id:userId},{$set:{isBlocked:status}});
    res.status(200).json(response);
    
  } catch (error) {
    console.log(error)
    
  }
}

const userWallet = async (req, res) => {
  try {
    console.log('entered in wallets function')

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    console.log('before checking session')

    // Check if the user is authenticated
    if (!req.session.user_id) {
      console.log('session')
      return res.redirect('/login'); // Redirect to the login page or handle it as per your authentication flow
    }
    console.log('user in wallet')

    // Fetch the user by ID
    const userId = req.session.user_id; // Assuming you have a user session
    const user = await userModel.findById(userId);
    console.log('userId in wallet',userId);

    if (!user) {
      return res.status(404).send('User not found'); // Handle this case appropriately
    }

    // Fetch the user's transactions
    const userTransactions = user.wallet.transactions;
    console.log('userTransactions ?',userTransactions)

    res.render('users/userWallet', { user, userTransactions });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error'); // Handle this error appropriately
}
};





const userAddCoupon = async (req, res) => {
  try {
    const totalAmountInCheckout = req.query.total;
    const currentDate = new Date();
    const category = await categoryModel.find();
    const coupons = await couponModel.find({
      // minimumAmount: { $lte: totalAmountInCheckout },
      expirationDate: { $gt: currentDate },

    });
    res.render("users/userCoupons", { coupons, category });
  } catch (error) {
    console.log(error.message);
  }
};



//////////////////adding coupon to the checkout
const userAddCouponpost = async (req, res) => {
  const shouldRedirect = true;
  if (shouldRedirect) {
    res.json({ redirect: true });
  } else {
    res.json({ redirect: false });
  }
};


const contactUsController = (req, res) => {
  res.render('users/contactUs');
};





module.exports = {
  userLandingPage,
  userLogin,
  userLogout,
  userSignup,
  userSendOtp,
  insertUser,
  hashPassword,
  loginLoad,
  verifyLogin,
  otpVerificaton,
  viewOtpPage,
  userHome,
  userProductDetails,
  userProfile,
  userProfileUpdated,
  userAddress,
  userAddAddressPost,
  userEditAddress,
  userUpdatedAddress,
  removeAddress,
  changePassword,
  updatePassword,
  updateStatus,
  userWallet,
  userProductLists,
  userCategory,
  userSortPrice,
  userAddCoupon,
  userAddCouponpost,
  contactUsController,

};
