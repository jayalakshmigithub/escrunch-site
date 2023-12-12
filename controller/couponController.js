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
  
      const coupon = await couponModel.find().skip(skipItems).limit(ITEMS_PER_PAGE);
  
      res.render("admin/adminCoupons", { coupon, currentPage: page, totalPages: totalPages });
    } catch (error) {
      console.log(error.message);
    }
  }
  
  
  
  
  //////////////////////to show admin create coupon page
  const adminAddCoupon = async (req, res) => {
    try {
      res.render("admin/adminAddCoupon");
    } catch (error) {
      console.log(error.message);
    }
  }
  
  
  
  
  ////////////////////to create new coupon from admin side
  const adminAddCouponPost = async (req, res) => {
    try {
      const couponData = req.body;
      console.log(couponData);
      await couponModel.create(couponData);
      res.redirect("/admin/coupons");
    } catch (error) {
      console.log(error.message);
    }
  }
  
  
  
  
  ////////////////////to show edit coupon page
  const adminEditCoupon = async (req, res) => {
    try {
      const couponId = req.query._id;
      const coupon = await couponModel.findById(couponId);
      res.render("admin/adminEditCoupon", { coupon });
    } catch (error) {
      console.log(error.message);
    }
  }
  
  
  
  /////////////////to edit the existing coupon
  const adminEditCouponPost = async (req, res) => {
    try {
      const couponId = req.body.id;
      const updatedCoupon = await couponModel.findById(couponId);
  
      updatedCoupon.code = req.body.code;
      updatedCoupon.description = req.body.description;
      updatedCoupon.discountType = req.body.discountType;
      updatedCoupon.discountAmount = req.body.discountAmount;
      updatedCoupon.minimumAmount = req.body.minimumAmount;
      updatedCoupon.expirationDate = req.body.expirationDate;
      updatedCoupon.maxRedemptions = req.body.maxRedemptions;
      updatedCoupon.isReferral = req.body.isReferral;
  
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
  
      res.redirect('/admin/coupons');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
    }
  }
  
  
  
  
  
  module.exports = {
    adminCoupons,
    adminAddCoupon,
    adminAddCouponPost,
    adminEditCoupon,
    adminEditCouponPost,
    deleteCoupon,
  }