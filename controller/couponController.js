const mongoose = require("mongoose");
const orderModel = require("../model/orderModel");
const couponModel = require("../model/couponModel");

const adminCoupons = async (req, res) => {
  try {
    const ITEMS_PER_PAGE = 10;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;
    const totalCount = await couponModel.countDocuments();
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const coupon = await couponModel
      .find()
      .skip(skipItems)
      .limit(ITEMS_PER_PAGE);

    res.render("admin/adminCoupons", {
      coupon,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//////////////////////to show admin create coupon page the Ogs
const adminAddCoupon = async (req, res) => {
  try {
    res.render("admin/adminAddCoupon");
  } catch (error) {
    console.log(error.message);
  }
};

// ////////////////////to create new coupon from admin side
// const adminAddCouponPost = async (req, res) => {
//   try {
//     const couponData = req.body;
//     console.log(couponData);
//     await couponModel.create(couponData);
//     res.redirect("/admin/coupons");
//   } catch (error) {
//     console.log(error.message);
//   }
// };

// ////////////////////to show edit coupon page
const adminEditCoupon = async (req, res) => {
  try {
    const couponId = req.query._id;
    const coupon = await couponModel.findById(couponId);
    res.render("admin/adminEditCoupon", { coupon });
  } catch (error) {
    console.log(error.message);
  }
};

// /////////////////to edit the existing coupon
// const adminEditCouponPost = async (req, res) => {
//   try {
//     const couponId = req.body.id;
//     const updatedCoupon = await couponModel.findById(couponId);

//     updatedCoupon.code = req.body.code;
//     updatedCoupon.description = req.body.description;
//     updatedCoupon.discountType = req.body.discountType;
//     updatedCoupon.discountAmount = req.body.discountAmount;
//     updatedCoupon.minimumAmount = req.body.minimumAmount;
//     updatedCoupon.expirationDate = req.body.expirationDate;
//     updatedCoupon.maxRedemptions = req.body.maxRedemptions;
  

//     await updatedCoupon.save();
//     res.redirect("/admin/coupons");
//   } catch (error) {
//     console.log(error.message);
//   }
// };


// To create new coupon from admin side
const adminAddCouponPost = async (req, res) => {
  try {
    const couponData = req.body;

    // If the discount type is percentage, convert the discount amount to a percentage value
    if (couponData.discountType === 'Percentage') {
      couponData.discountAmount = parseFloat(couponData.discountAmount);
      if (isNaN(couponData.discountAmount) || couponData.discountAmount < 0 || couponData.discountAmount > 100) {
        // Handle invalid percentage values
        console.log("Invalid percentage value");
        return res.redirect("/admin/coupons");
      }

      // Convert the percentage value to a decimal
      couponData.discountAmount /= 100;
      // Calculate and set the absolute discount amount for display
      couponData.displayDiscountAmount = couponData.discountAmount * 100;
    }

    await couponModel.create(couponData);
    res.redirect("/admin/coupons");
  } catch (error) {
    console.log(error.message);
  }
}

// To edit the existing coupon
const adminEditCouponPost = async (req, res) => {
  try {
    const couponId = req.body.id;
    const updatedCoupon = await couponModel.findById(couponId);

    updatedCoupon.code = req.body.code;
    updatedCoupon.description = req.body.description;
    updatedCoupon.discountType = req.body.discountType;

    // If the discount type is percentage, convert the discount amount to a percentage value
    if (updatedCoupon.discountType === 'Percentage') {
      updatedCoupon.discountAmount = parseFloat(req.body.discountAmount);
      if (isNaN(updatedCoupon.discountAmount) || updatedCoupon.discountAmount < 0 || updatedCoupon.discountAmount > 100) {
        // Handle invalid percentage values
        console.log("Invalid percentage value");
        return res.redirect("/admin/coupons");
      }

      // Convert the percentage value to a decimal
      updatedCoupon.discountAmount /= 100;
      // Calculate and set the absolute discount amount for display
      updatedCoupon.displayDiscountAmount = updatedCoupon.discountAmount * 100;
    } else {
      // If the discount type is not percentage, use the provided discount amount as is
      updatedCoupon.discountAmount = req.body.discountAmount;
      // Set displayDiscountAmount to the same value for fixed discounts
      updatedCoupon.displayDiscountAmount = updatedCoupon.discountAmount;
    }

    updatedCoupon.minimumAmount = req.body.minimumAmount;
    updatedCoupon.expirationDate = req.body.expirationDate;
    updatedCoupon.maxRedemptions = req.body.maxRedemptions;

    await updatedCoupon.save();
    res.redirect("/admin/coupons");
  } catch (error) {
    console.log(error.message);
  }
}















/////////////////to delete coupon
const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.query._id;

    // Delete the category with the specified ID
    await couponModel.deleteOne({ _id: couponId });

    res.redirect("/admin/coupons");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  adminCoupons,
  adminAddCoupon,
  adminAddCouponPost,
  adminEditCoupon,
  adminEditCouponPost,
  deleteCoupon,
};
