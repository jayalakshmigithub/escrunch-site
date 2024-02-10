const adminRoute = require("../routes/adminRoutes");
const { configDotenv } = require("dotenv");
const userModel = require("../model/userModel");
const orderModel = require("../model/orderModel");
const productModel = require("../model/productModel");
const categoryModel = require("../model/categoryModel");
const bannerModel = require("../model/bannerModel");
const userHelper = require("../helper/userHelper");
const bcrypt = require("bcrypt");
const moment = require("moment");
const puppeteer = require("puppeteer");
const excel = require("exceljs");
const fs = require("fs");
const sharp = require("sharp");
const { cropBannerImage } = require("../multer/bannerCrop");
const category = require("../model/categoryModel");

const adminLogin = async (req, res) => {
  try {
    res.render("admin/adminLogin");
  } catch (err) {
    console.log(err.message);
  }
};

const adminLogout = async(req,res)=>{
    try{
        req.session.admin=false
        res.redirect('/admin/login')

    }catch(err){
        console.log(err.message);

    }
}



const verifyAdmin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const adminData = await userModel.findOne({ email: email });

    if (!adminData) {
      return res.render("admin/adminLogin", { msg: "Admin not found" });
    }

    const passwordMatch = await bcrypt.compare(password, adminData.password);

    if (!adminData.isAdmin) {
      return res.render("admin/adminLogin", { msg: "Admin not verified" });
    }
    if (passwordMatch) {
      req.session.admin = true; // Set the admin session variable
      req.session.adminData = adminData; // Store admin data in the session if needed

      console.log(req.session.adminData);
      res.redirect("/admin/adminHome"); // Redirect to the admin home page
    } else {
      return res.render("admin/adminLogin", {
        msg: "Email or password is incorrect",
      });
    }
  } catch (error) {
    console.error(error.message);
    return res.render("admin/adminLogin", {
      msg: "An error occurred. Please try again later.",
    });
  }
};


async function calculateDeliveredOrderTotal() {
  try {
    const totalData = await orderModel.aggregate([
      {
        $match: {
          orderStatus: "Delivered",
        },
      },
      {
        $group: {
          _id: null,
          totalPriceSum: { $sum: "$totalAmount" }, // Adjusted to use 'totalAmount' field
          count: { $sum: 1 },
        },
      },
    ]);

    if (totalData.length === 0) {
      return {
        _id: null,
        totalPriceSum: 0,
        count: 0,
      };
    }

    // Return the first element of the array as the result
    return totalData[0];
  } catch (error) {
    throw error;
  }
}

const calculateCategorySales = async () => {
  try {
    const ordersWithDetails = await orderModel.aggregate([
      {
        $match: {
          orderStatus: "Delivered", // Filter orders with orderStatus 'Delivered'
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.categoryname",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: "$categoryDetails",
      },
      {
        $group: {
          _id: "$productDetails.categoryname",
          categoryName: { $first: "$categoryDetails.categoryname" },
          totalSales: {
            $sum: {
              $multiply: ["$productDetails.price", "$products.quantity"],
            },
          },
        },
      },
    ]);

    return ordersWithDetails;
  } catch (error) {
    console.error("Error fetching orders with details:", error);
  }
};

async function calculateDailySales() {
  try {
    const dailySalesData = await orderModel.aggregate([
      {
        $match: {
          orderStatus: "Delivered",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt", // Assuming 'createdAt' is the date field for the order
            },
          },
          dailySales: {
            $sum: "$totalAmount", // Adjusted to use 'totalAmount' field
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    return dailySalesData;
  } catch (error) {
    throw error;
  }
}

async function calculateOrderCountByDate() {
  try {
    const orderCountData = await orderModel.aggregate([
      {
        $match: {
          orderStatus: "Delivered",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt", // Assuming 'createdAt' is the date field for the order
            },
          },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    return orderCountData;
  } catch (error) {
    throw error;
  }
}

async function calculateProductsCount() {
  try {
    const productCount = await productModel.countDocuments();

    return productCount;
  } catch (error) {
    throw error;
  }
}

async function calculateOnlineOrderCountAndTotal() {
  try {
    const onlineOrderData = await orderModel.aggregate([
      {
        $match: {
          paymentMode: "onlinepayment", // Adjusted to 'paymentMode' based on your schema
          orderStatus: "Delivered",
        },
      },
      {
        $group: {
          _id: null,
          totalPriceSum: { $sum: "$totalAmount" }, // Adjusted to use 'totalAmount' field
          count: { $sum: 1 },
        },
      },
    ]);

    return onlineOrderData;
  } catch (error) {
    throw error;
  }
}

async function calculateCodOrderCountAndTotal() {
  try {
    const codOrderData = await orderModel.aggregate([
      {
        $match: {
          paymentMode: "cashondelivery", // Adjusted to 'paymentMode' based on your schema
          orderStatus: "Delivered",
        },
      },
      {
        $group: {
          _id: null,
          totalPriceSum: { $sum: "$totalAmount" }, // Adjusted to use 'totalAmount' field
          count: { $sum: 1 },
        },
      },
    ]);

    return codOrderData;
  } catch (error) {
    throw error;
  }
}

async function getLatestOrders() {
  try {
    const latestOrders = await orderModel.aggregate([
      {
        $unwind: "$items", // Adjusted to '$items' based on your schema
      },
      {
        $sort: {
          createdAt: -1, // Adjusted to 'createdAt' assuming it's the order creation date
        },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $addFields: {
          username: {
            $arrayElemAt: ["$userDetails.name", 0],
          },
          address: {
            $arrayElemAt: ["$userDetails.address.name", 0],
          },
        },
      },
      {
        $project: {
          userDetails: 0,
        },
      },
    ]);

    return latestOrders;
  } catch (error) {
    throw error;
  }
}

async function calculateListedCategoryCount() {
  try {
    const listedCategoryCount = await categoryModel.countDocuments({
      listed: true,
    });

    return listedCategoryCount;
  } catch (error) {
    throw error;
  }
}

const adminHome = async (req, res) => {
  try {
    const ordersData = await calculateDeliveredOrderTotal();

    const orders = ordersData;
    const categorySales = await calculateCategorySales();
    const salesData = await calculateDailySales();
    const salesCount = await calculateOrderCountByDate();
    const categoryCount = await calculateListedCategoryCount();
    const productsCount = await calculateProductsCount();
    const onlinePay = await calculateOnlineOrderCountAndTotal();
    const codPay = await calculateCodOrderCountAndTotal();
    const latestorders = await getLatestOrders();

    
    console.log(categorySales, "get dashBorders categorySales");
    

    res.render("admin/adminHome", {
      orders,
      productsCount,
      categoryCount,
      onlinePay: onlinePay[0],
      salesData,
      order: latestorders,
      salesCount,
      codPay: codPay[0],
      categorySales,
    });
  } catch (error) {
    res.render("/error");
  }
};


const adminUsersList = async (req, res) => {
  try {
    const user = await userModel.find();
    if (user) res.render("admin/adminUsersList", { data: user });
  } catch (err) {
    console.log("Error getting users:", err);
    throw err;
  }
};

// const adminBlockUnblock = async (req, res) => {
//   try {
//     const userId = req.body.id;
//     const user = await userModel.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     user.isBlocked = !user.isBlocked; // Toggle the isBlocked field

//     await user.save();
//     res.json({
//       status: true,
//       message: user.isBlocked
//         ? "User blocked successfully"
//         : "User unblocked successfully",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const adminBlockUnblock = async (req, res) => {
  try {
    const userId = req.body.id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user being blocked is currently authenticated
    if (req.user && req.user._id.toString() === userId) {
      // Log out the user if they are currently authenticated
      req.logout();
    }

    user.isBlocked = !user.isBlocked; // Toggle the isBlocked field

    await user.save();
    res.json({
      status: true,
      message: user.isBlocked
        ? "User blocked successfully"
        : "User unblocked successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};


const salesreport = async (req, res, next) => {
  try {
    let { from, to } = req.query;

    const today = moment().format("YYYY-MM-DD");
    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");
    const last7days = moment().subtract(7, "days").format("YYYY-MM-DD");
    const last30days = moment().subtract(30, "days").format("YYYY-MM-DD");
    const lastYear = moment().subtract(1, "years").format("YYYY-MM-DD");

    if (!from || !to) {
      from = last30days;
      to = today;
    }

    if (from > to) [from, to] = [to, from];
    to += "T23:59:59.999Z";

    const orders = await orderModel
      .find({ createdAt: { $gte: from, $lte: to }, orderStatus: "Delivered" })
      .populate("user");

    from = from.split("T")[0];
    to = to.split("T")[0];

    const netTotalAmount = orders.reduce(
      (acc, order) => acc + order.totalAmount,
      0
    );
    const netFinalAmount = orders.reduce(
      (acc, order) => acc + order.finalAmount,
      0
    );
    const netDiscount = orders.reduce((acc, order) => acc + order.discount, 0);
    const dateRanges = [
      { text: "Today", from: today, to: today },
      { text: "Yesterday", from: yesterday, to: yesterday },
      { text: "Last 7 days", from: last7days, to: today },
      { text: "Last 30 days", from: last30days, to: today },
      { text: "Last year", from: lastYear, to: today },
    ];

    // pagination
    const ITEMS_PER_PAGE = 15;
    const page = parseInt(req.query.page) || 1;
    const skipItems = (page - 1) * ITEMS_PER_PAGE;
    console.log("Count of Delivered Orders:", orders.length);
    const totalCount = orders.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    //pagination endss
    //  const order = await orderModel.find({}).populate('user').skip(skipItems)
    //  .limit(ITEMS_PER_PAGE)
    // res.render("admin/adminOrderLists",{order, currentPage:page, totalPages:totalPages});

    res.render("admin/adminSalesReport", {
      orders,
      from,
      to,
      dateRanges,
      netTotalAmount,
      netFinalAmount,
      netDiscount,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const salesreportpost = async (req, res) => {
  try {
    const fromDate = new Date(req.query.fromDate);
    const toDate = new Date(req.query.toDate);

    // Fetch order data for the specified date range using the aggregate pipeline
    const orderData = await orderModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(new Date(fromDate).setHours(0, 0, 0)), // Start of the day
            $lte: new Date(new Date(toDate).setHours(23, 59, 59)), // End of the day
          },
          status: { $ne: "Cancelled" }, // Exclude orders with status "Cancelled"
        },
      },
    ]);

    // Get all unique product IDs from all orders
    const productIds = Array.from(
      new Set(
        orderData.flatMap((order) => order.items.map((items) => items.product))
      )
    );

    // Find the products with matching IDs
    const prod = await productModel.find({ _id: { $in: productIds } });

    // Create a Map to store product names with their IDs as keys
    const productMap = new Map(
      prod.map((product) => [product._id.toString(), product.productname])
    );

    // Prepare the orderDetails array with required data for rendering
    const orderDetails = orderData.map((ord) => {
      const orderDate = new Date(ord.date);
      const year = orderDate.getFullYear();
      const month = getMonthName(orderDate.getMonth() + 1); // Get the month in words
      const date = orderDate.getDate();
      const formattedDate = `${date} ${month} ${year}`;

      const productsWithNames = ord.items.map((item) => {
        const productName = productMap.get(item.product.toString());
        return { ...item, productname: productName };
      });

      return {
        orderid: ord._id,
        name: ord.user.firstname, // Assuming the user object has a 'name' property
        mobile: ord.user.phonenumber, // Assuming the address object has an 'address' property
        grandTotal: ord.finalPrice, // Updated field name for the total amount
        status: ord.orderStatus, // Updated field name for the order status
        payment_method: ord.paymentMode, // Updated field name for the payment mode
        orderdate: formattedDate,
        
        product: productsWithNames,
      };
    });

    // Respond with the combined data (orderDetails and salesReportResult)
    res.json({ orderDetails });
  } catch (error) {
    console.error("Error fetching sales report data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const adminDownloadReports = async (req, res, next) => {
  try {
    console.log("Hi");
    const { type } = req.params;
    let { from, to } = req.query;
    to += "T23:59:59.999Z";
    const orders = await orderModel
      .find({ createdAt: { $gte: from, $lte: to }, orderStatus: "Delivered" })
      .populate("user");
    const netTotalAmount = orders.reduce(
      (acc, order) => acc + order.totalAmount,
      0
    );
    const netFinalAmount = orders.reduce(
      (acc, order) => acc + order.finalPrice,
      0
    );
    const netDiscount = orders.reduce(
      (acc, order) => acc + order.discountAmount,
      0
    );

    if (type === "excel") {
      const workbook = new excel.Workbook();
      const worksheet = workbook.addWorksheet("Report");

      worksheet.columns = [
        { header: "SL. No", key: "s_no", width: 10 },
        { header: "Order ID", key: "oid", width: 20 },
        { header: "Date", key: "createdAt", width: 20 },
        { header: "User ID", key: "userID", width: 20 },
        { header: "Total Price", key: "totalAmount", width: 20 },
        { header: "Discount", key: "discountAmount", width: 20 },
        { header: "Final Price", key: "finalPrice", width: 20 },
        { header: "Payment Mode", key: "paymentMode", width: 20 },
      ];

      worksheet.duplicateRow(1, 8, true);
      worksheet.getRow(1).values = ["Sales Report"];
      worksheet.getRow(1).font = { bold: true, size: 16 };
      worksheet.getRow(1).alignment = { horizontal: "center" };
      worksheet.mergeCells("A1:H1");

      worksheet.getRow(2).values = [];
      worksheet.getRow(3).values = ["", "From", from];
      worksheet.getRow(3).font = { bold: false };
      worksheet.getRow(3).alignment = { horizontal: "right" };
      worksheet.getRow(4).values = ["", "To", to.split("T")[0]];
      worksheet.getRow(5).values = ["", "Total Orders", orders.length];
      worksheet.getRow(6).values = ["", "Net Final Price", netFinalAmount];

      worksheet.getRow(7).values = [];
      worksheet.getRow(8).values = [];

      let count = 1;
      orders.forEach((order) => {
        order.s_no = count;
        order.oid = order._id.toString().replace(/"/g, "");
        order.userID = order.user.email;
        worksheet.addRow(order);
        count += 1;
      });

      worksheet.getRow(9).eachCell((cell) => {
        cell.font = { bold: true };
      });

      worksheet.addRow([]);
      worksheet.addRow([]);

      worksheet.addRow([
        "",
        "",
        "",
        "",
        "",
        "",
        "Net Total Price",
        netTotalAmount,
        "",
      ]);
      worksheet.addRow([
        "",
        "",
        "",
        "",
        "",
        "",
        "Net Discount Price",
        netDiscount,
        "",
      ]);
      worksheet.addRow([
        "",
        "",
        "",
        "",
        "",
        "",
        "Net Final Price",
        netFinalAmount,
        "",
      ]);
      worksheet.lastRow.eachCell((cell) => {
        cell.font = { bold: true };
      });

      await workbook.xlsx.writeFile("sales_report.xlsx");
      const file = `${__dirname}/../sales_report.xlsx`;
      res.download(file);
    } else {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      // Set content and styles for the PDF
      const content = `
                <!DOCTYPE html>
                <html lang="en">

                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Document</title>
                    <style>
                        .text-center {
                            text-align: center;
                        }

                        .text-end {
                            text-align: end;
                        }

                        .table-container {

                            width: 80%;
                            margin: 0 auto;
                            margin-top: 1.5rem;
                            border-radius: 5px;
                        }

                        table {
                            caption-side: bottom;
                            border-collapse: collapse;
                            margin-bottom: 1rem;
                            vertical-align: top;
                            border-color: #dee2e6;
                            border: 1px solid #ccc;
                            border-bottom: 1px solid #444;
                            width: 80%;
                            margin: 0 auto;
                            margin-top: 1.5rem;
                            border-radius: 10px;
                        }

                        thead {
                            border-color: inherit;
                            border-style: solid;
                            border-width: 0;
                            vertical-align: bottom;
                        }

                        tr {
                            font-size: 12px;
                            border-color: inherit;
                            border-style: solid;
                            border-width: 0;
                        }

                        td {
                            border-color: inherit;
                            border-style: solid;
                            border-width: 0;
                            padding: .5rem .5rem;
                            background-color: transparent;
                            border-bottom-width: 1px;
                            box-shadow: inset 0 0 0 9999px #fff;
                            max-width: 100px;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }

                        .d-flex-column {
                            display: flex;
                            flex-direction: column;
                        }

                        .fw-bold {
                            font-weight: bold;
                        }

                        * {
                            font-size: 14px;
                            color: #444;
                        }
                    </style>
                </head>

                <body>
                    <div>
                        <div class="text-center">
                            <h6>Sales reports</span>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">SL. No</th>
                                    <th scope="col">Date</th>
                                    <th scope="col">User ID</th>
                                    <th scope="col">Quantity</th>
                                    <th scope="col">Total Price</th>
                                    <th scope="col">Discount</th>
                                    <th scope="col">Final Price</th>
                                    <th scope="col">Payment Mode</th>
                                </tr>
                            </thead>
                            <tbody>

                                ${orders
                                  .map(
                                    (order, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${order._id
                                      .toString()
                                      .replace(/"/g, "")}</td>
                                    <td>${
                                      order.createdAt
                                        .toISOString()
                                        .split("T")[0]
                                    }</td>
                                    <td>${order.user.email}</td>
                                    <td>${order.totalAmount}</td>
                                    <td>${order.discountAmount}</td>
                                    <td>${order.finalPrice}</td>
                                    <td>${order.paymentMode}</td>
                                </tr>`
                                  )
                                  .join("")}

                                <tr>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td>
                                        <div class="d-flex-column text-end">
                                            <br>
                                            <span>Net Total Price:</span>
                                            <span>Net Discount:</span>
                                            <span class="fw-bold">Net Final Price:</span>
                                        </div>
                                    </td>
                                    <td class="">
                                        <div class="d-flex-column">
                                            <br>
                                            <span>${netTotalAmount}</span>
                                            <span>${netDiscount}</span>
                                            <span class="fw-bold">${netFinalAmount}</span>
                                        </div>
                                    </td>
                                </tr>

                            </tbody>
                        </table>

                    </div>
                </body>

                </html>`;

      await page.setContent(content);
      await page.pdf({ path: "sales_report.pdf", format: "A4" });

      await browser.close();

      const file = `${__dirname}/../sales_report.pdf`;
      res.download(file);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const adminBannerList = async (req, res) => {
  try {
    const ITEMS_PER_PAGE = 12
    const page = parseInt(req.query.page) || 1
    const skipItems = (page - 1) * ITEMS_PER_PAGE
    const totalCount = await orderModel.countDocuments()
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
    const banner = await bannerModel.find().sort({ createdAt: -1 }).skip(skipItems)
      .limit(ITEMS_PER_PAGE)
    if (banner) res.render("admin/adminBannerLists", { data: banner, currentPage: page, totalPages: totalPages });
  } catch (error) {
    console.error("Error getting banners:", error);
    throw error;
  }
}


const adminAddbanner = async (req, res) => {
  try {
    console.log("admin add banner");
    res.render("admin/adminAddBanner");
  } catch (error) {
    console.error(error.message);
  }
};

const adminAddedBanner = async (req, res) => {
  console.log("added banner");
  const { bannername, bannerurl } = req.body;
  let images = req.file.filename;
  let imageName = `cropped_${images}`;
  const inputFilePath = `public/uploadProductImages/${images}`;
  const outputFilePath = `public/uploadProductImages/${imageName}`;

  try {
    await cropBannerImage(inputFilePath, outputFilePath);
    images = imageName;

    const banner = await bannerModel.create({ bannername, bannerurl, images });
    if (banner) {
      const allBanners = await bannerModel.find();
      res.redirect("/admin/bannerlist");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const adminEditBanner = async (req, res) => {
  try {
    const bannerId = req.query._id;
    const banner = await bannerModel.findById(bannerId);
    res.render("admin/adminEditBanner", { banner });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const adminEditedBanner = async (req, res) => {
  try {
    const { bannername, _id, bannerurl } = req.body;
    const data = { bannername, bannerurl };
    if (req.file && req.file.filename) {
      let images = req.file.filename;
      let imageName = `cropped_${images}`;
      const inputFilePath = `public/uploadProductImages/${images}`;
      const outputFilePath = `public/uploadProductImages/${imageName}`;

      await cropBannerImage(inputFilePath, outputFilePath);
      data.images = imageName;
    }
    const banner = await bannerModel.findByIdAndUpdate(_id, data);

    res.redirect("/admin/bannerlist");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const bannerId = req.query._id;

    // Delete the category with the specified ID
    await bannerModel.deleteOne({ _id: bannerId });

    res.redirect("/admin/bannerlist");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  adminLogin,
  adminLogout,
  verifyAdmin,
  adminHome,
  adminBlockUnblock,
  adminUsersList,
  salesreport,
  salesreportpost,
  adminDownloadReports,
  adminBannerList,
  adminAddbanner,
  adminAddedBanner,
  adminEditBanner,
  adminEditedBanner,
  deleteBanner,
};
