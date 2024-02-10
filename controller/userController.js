const userModel = require("../model/userModel");
const otpVerificationHelper = require("../helper/otpVerificationHelper");
const bcrypt = require("bcrypt");
const productModel = require("../model/productModel");
const categoryModel = require("../model/categoryModel");
const wishlistModel = require("../model/wishlistModel");
const couponModel = require("../model/couponModel");
const bannerModel = require("../model/bannerModel");
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
const session = require("express-session");
const mongoose = require("mongoose");
const cacheControl = require("../middleware/cacheControlMiddleware");
const cropImage = require("../multer/productImageCrop");
const product = require("../multer/product");
const catImgCrop = require("../multer/catImgCrop");
const nodemailer = require("nodemailer");

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

    const result = await usermodel.save();

    if (result) {
      await sendOTP(req.body.mobile);
      res.render("users/otpValidation", { mobile: req.body.mobile });
    } else {
      res.render("users/userSignup", { error: "Error creating user." });
    }
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error (mobile number already exists)
      res.render("users/userSignup", {
        error: "User with this mobile number already exists.",
      });
    } else {
      console.log(err.message);
      res.render("users/userSignup", { error: "An error occurred." });
    }
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
    const banner = await bannerModel.find();
    res.render("users/userLandingPage", {
      products: products,
      banner,
      category,
    });
  } catch (err) {
    console.log(err.message);
  }
};


const userLogin = async (req, res) => {
  try {
    console.log("in loginn");
    if (req.session.user_id) {
      res.redirect("/home");
    } else {
      res.render("users/userLogin", { err: "user not found" });
    }
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

const loginLoad = async (req, res) => {
  console.log(req.session.user_id);
  try {
    if (req.session.user_id) {
      console.log("hah", req.session.user_id);
      console.log("in login loaadddd");

      res.redirect("/home");
    } else {
      res.render("users/userLogin");
    }
  } catch (err) {
    console.log(err.message);
  }
};

//verify to login to the page

const verifyLogin = async (req, res) => {
  try {
    console.log("in verify login");
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
      if (userData.isBlocked) {
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
    console.log("homee enter ");
    let products = await productModel.find({ status: "Listed" });
    let user = await userModel.find();
    console.log(products);
    let banner = await bannerModel.find();

    res.render("./users/userHome", { products: products, banner, user });
  } catch (err) {
    res.send(err);
    console.log(err.message);
  }
};

const userProductLists = async (req, res) => {
  try {
    console.log("enterd in this productlist");
    const results = await productModel.aggregate([
      {
        $group: {
          _id: "$categoryname",
          count: { $sum: 1 },
        },
      },
    ]);
    console.log("results in product list", results);
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
      res.render("users/userProductLists", {
        products,
        currentPage: page,
        totalPages: totalPages,
        category: categoriesWithCounts,
        sortOption: req.query.sortOption || "1",
      });
  } catch (error) {
    console.log(error.message);
  }
};


const userSearch = async (req, res, next) => {
  try {
    console.log("hi from search");
    const query = req.query.query;
    const regex = new RegExp(query, "i");
    const searchResults = await productModel.find({
      $or: [{ productname: regex }],
    });

    const ITEMS_PER_PAGE = 3;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;
    const totalCount = searchResults.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    res.render("users/userSearch", {
      results: searchResults,
      query: query,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const userCategory = async (req, res) => {
  try {
    const catId = req.params.id;
    const category = await categoryModel.findOne({ _id: catId });
    const categoryname = category.categoryname;
    const products = await productModel
      .find({ categoryname: catId })
      .populate("categoryname");

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
    console.log("prods in category", prods);

    if (prods)
      res.render("users/userCategory", {
        products,
        currentPage: page,
        totalPages: totalPages,
        catId,
        categoryname,
      });
  } catch (error) {
    console.log(error.message);
  }
};



const userSortPrice = async (req, res) => {
  try {
    console.log("entered here in sort");
    const results = await productModel.aggregate([
      {
        $match: { status: "Listed" }, // consider only  'Listed' products
      },
      {
        $group: {
          _id: "$categoryname",
          count: { $sum: 1 },
        },
      },
    ]);
    const sortOptions = req.query.sortOption || "1";

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

    if (sortOption === "2") {
      sortCriteria = { price: 1 }; // Sort by Price: Low to High
    } else if (sortOption === "3") {
      sortCriteria = { price: -1 }; // Sort by Price: High to Low
    }

    const ITEMS_PER_PAGE = 3;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;
    const totalCount = await productModel.countDocuments({ status: "Listed" });
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const sortedProducts = await productModel
      .find({ status: "Listed" })
      .populate("categoryname")
      .sort(sortCriteria)
      .skip(skipItems)
      .limit(ITEMS_PER_PAGE);

    if (sortedProducts) {
      res.render("users/userSortPrice", {
        products: sortedProducts,
        currentPage: page,
        totalPages: totalPages,
        category: categoriesWithCounts,
        sortOption: sortOptions,

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

    res.render("users/userProfile", { user, category });
  } catch (error) {
    console.log(error.message);
  }
};

// Your route or controller function for changing the password
const changePassword = async (req, res) => {
  try {
    // You can directly render the page without any checks or input validation
    res.render("users/changePassword");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
};

const updatePassword = async (req, res) => {
  try {
    const userId = req.session.user_id._id;
    console.log(userId, "hiiii hlooo");
    const userdetails = await userModel.findOne({ _id: userId });
    console.log(userdetails);
    console.log(req.body, "req,body");
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const checkPassword = await bcrypt.compare(
      oldPassword,
      userdetails.password
    );
    if (checkPassword) {
      const newPass = await bcrypt.hash(newPassword, 10);
      await userModel.updateOne(
        { _id: userId },
        { $set: { password: newPass } }
      );
      res
        .status(201)
        .json({ status: true, message: "password updated successfully" });
    } else {
      res.json({ status: false, message: "password does not match" });
    }
  } catch (err) {
    console.log(err);
  }
};

const userProfileUpdated = async (req, res) => {
  try {
    console.log("Updating user profile...");
    const userId = req.session.user_id;
    const name = req.body.name;
    const phonenumber = req.body.phonenumber;
    console.log("Name:", name, "Phone Number:", phonenumber);
    const user = await userModel.findByIdAndUpdate(
      userId,
      { name, phonenumber },
      { new: true }
    );

    // flag : update was successful
    const isUpdated = true;

    // Pass the flag and the updated user data to the template
    res.render("users/userProfile", { user, isUpdated });
  } catch (error) {
    console.log(error.message);
  }
};

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
      res.redirect("/userProfile");
    } else {
      res.json({ status: false });
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
    const userId = req.session.user_id;
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

const updateStatus = async (req, res) => {
  try {
    const userId = req.body.id;
    const status = req.body.status;
    const response = await userModel.updateOne(
      { _id: userId },
      { $set: { isBlocked: status } }
    );
    res.status(200).json(response);
  } catch (error) {
    console.log(error);
  }
};

const userWallet = async (req, res) => {
  try {
    console.log("entered in wallets function");
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    console.log("before checking session");
    // Check if the user is authenticated
    if (!req.session.user_id) {
      console.log("session");
      return res.redirect("/login");
    }
    // Fetch the user by ID
    const userId = req.session.user_id;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    // Fetch user's transactions
    const userTransactions = user.wallet.transactions;
    // const walletSum = userTransactions.reduce((total, transaction) => {
    //   return total + (transaction.type === 'credit' ? transaction.amount : -transaction.amount);
    // }, 0);

    console.log("userTransactions ?", userTransactions);
    res.render("users/userWallet", { user, userTransactions });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error"); // Handle this error appropriately
  }
};



// //////////////////adding coupon to the checkout

const contactUsController = (req, res) => {
  res.render("users/contactUs");
};



const userAddCoupon = async (req, res) => {
  try {
    const totalAmountInCheckout = req.query.total;
    const currentDate = new Date();

    const category = await categoryModel.find();

    const coupons = await couponModel.find({
      discountAmount: { $lte: totalAmountInCheckout },
      expirationDate: { $gt: currentDate },
      discountType: "Percentage",
    });

    const formattedCoupons = coupons.map((coupon) => {
      const displayDiscountAmount =
        (coupon.discountAmount / 100) * totalAmountInCheckout;
      return {
        _id:coupon._id,
        code: coupon.code,
        description: coupon.description,
        displayDiscountAmount: displayDiscountAmount,
        expirationDate: coupon.expirationDate,
      };
    });
    console.log("Total Amount in Checkout:", totalAmountInCheckout);

    // Log the formatted coupons for debugging
    console.log("Formatted Coupons:", formattedCoupons);

    res.render("users/userCoupons", { coupons: formattedCoupons, category });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const userAddCouponpost = async (req, res) => {
  try {
    const couponData = req.body;
    couponData.discountAmount = parseFloat(couponData.discountAmount);
    if (
      isNaN(couponData.discountAmount) ||
      couponData.discountAmount < 0 ||
      couponData.discountAmount > 100
    ) {
      console.log("Invalid percentage value");
      return res.json({ redirect: false });
    }
    const shouldRedirect = true;
    if (shouldRedirect) {
      res.json({ redirect: true });
    } else {
      res.json({ redirect: false });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//to display user wishlist
const userWishlist = async (req, res) => {
  try {
    console.log("inside wishlist");
    const user1 = req.session.user;
    const userId = req.session.user_id;
    let wishlist = await wishlistModel.findOne({ user: userId });

    if (wishlist == null) {
      wishlist = await wishlistModel.create({ user: userId }); //if no cart, create cart for the user
    }

    wishlist = await wishlistModel
      .findOne({ user: userId })
      .populate({ path: "products.product" });
    res.render("users/userWishlist", { wishlist});
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

//add product to the wishlist
const addToWishlist = async (req, res) => {
  try {
    console.log("add to wishlist...");
    const userId = req.session.user_id;
    const { productId } = req.body;

    let wishlist = await wishlistModel.findOne({ user: userId });
    console.log("hii");

    if (!wishlist) {
      wishlist = new wishlistModel({ user: userId, products: [] });
    }

    const productIndex = wishlist.products.findIndex(
      (product) => product.product.toString() === productId
    );

    if (productIndex === -1) {
      wishlist.products.push({ product: productId }); // Ensure 'product' is set

      await wishlist.save();
      return res.status(200).json({ success: true });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Product already in wishlist" });
    }
  } catch (error) {
    console.error(error.message);
    // Log the validation errors if any
    if (error.errors) {
      Object.keys(error.errors).forEach((field) => {});
    }
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

////////////////////remove product from the wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { wishlistId, productId } = req.params;
    // Find the cartlist document by ID
    const wishlist = await wishlistModel.findById(wishlistId);

    if (!wishlist) {
      return res.status(404).json({ error: "wishlist not found" });
    }

    // Find the index of the product in the "products" array
    const productIndex = wishlist.products.findIndex(
      (product) => product.product.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ error: "Product not found in cart" });
    }

    // Remove the product from the "products" array
    wishlist.products.splice(productIndex, 1);

    // Save the updated cartlist document
    const updatedWishlist = await wishlist.save();
    res.redirect("/wishlist");
  } catch (error) {
    console.error("Error deleting product from wishlist:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
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
  userSearch,
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
  userWishlist,
  addToWishlist,
  removeFromWishlist,
  contactUsController,
};
