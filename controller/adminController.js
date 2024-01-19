const adminRoute = require("../routes/adminRoutes");
const { configDotenv } = require("dotenv");
const userModel = require("../model/userModel");
const orderModel = require("../model/orderModel");
const productModel = require("../model/productModel");
const userHelper = require("../helper/userHelper");
const bcrypt = require("bcrypt");
const moment = require("moment");
const puppeteer = require("puppeteer");
const excel = require("exceljs");
const fs = require("fs");


const adminLogin = async (req, res) => {
  try {
    res.render("admin/adminLogin");
  } catch (err) {
    console.log(err.message);
  }
};

// const adminLogout = async(req,res)=>{
//     try{
//         req.session.admin=false
//         res.redirect('/admin/login')

//     }catch(err){
//         console.log(err.message);

//     }
// }

// const verifyAdmin = async(req,res)=>{

//     try{
//         console.log(req.body,'ooo');
//         const email = req.body.email;
//         const password = req.body.password;

//         console.log("at verifyadmin, admincontroller- Admin signinpage printing email,password",email,password);
//         const admin = await userHelper.getUser({email:email,password:password});
//         console.log("checked & found admin user in db",admin);

//         if(!admin){
//             return res.redirect('/admin/login');
//         }

//         if(admin){
//             req.session.admin = true;
//             req.session.admin1 = admin;

//             console.log(admin+'checked admin,true,redirecting to admin home page');
//             res.redirect('/admin/adminHome');
//         }

//     }catch(error){
//         console.log(error.message);
//     }
// }
// const verifyAdmin = async(req,res)=>{

//     try{
//         console.log(req.body,'ooo');
//         const email = req.body.email;
//         const password = req.body.password;

//         console.log("at verifyadmin, admincontroller- Admin signinpage printing email,password");
//         const admin = await userHelper.getUser({email:email,password:password});
//         console.log("checked & found admin user in db",admin);

//         if(!admin){
//             return res.redirect('/admin/login');
//         }

//         if(admin){
//             req.session.admin = true;
//             req.session.admin1 = admin;

//             console.log(admin+'checked admin,true,redirecting to admin home page');
//             res.redirect('/admin/adminHome');
//         }

//     }catch(error){
//         console.log(error.message);
//     }
// }
// const verifyAdmin = async (req, res) => {
//     try {
//       const email = req.body.email;
//       const password = req.body.password;

//       const adminData = await userModel.findOne({ email: email });

//       if (!adminData) {
//         console.log('gshsli')
//         return res.render("admin/adminLogin", { msg: "Admin not found" });
//       }

//       const passwordMatch = await bcrypt.compare(password, adminData.password);

//       if (!adminData.isAdmin) {
//         return res.render("admin/adminLogin", { msg: "Admin not verified" });
//       }
//       if (passwordMatch) {
//         req.session.admin_id = adminData;
//         console.log(req.session.admin_id);
//          res.redirect("/admin/adminhome");
//       } else {
//         return res.render("admin/adminLogin", {
//           msg: "Email or password is incorrect",
//         });
//       }
//     } catch (error) {
//       console.error(error.message);
//       return res.render("admin/adminLogin", {
//         msg: "An error occurred. Please try again later.",
//       });
//     }
//   };

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

// const adminHome = async(req,res)=>{
//     try{
//        res.render('admin/adminHome');
//        const orders = await orderModel.aggregate([
//         { $match: { orderStatus: 'Delivered' } },
//         {
//           $group: {
//             _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
//             total: { $sum: '$totalAmount' },
//             count: { $sum: 1 },
//           },
//         },
//         { $sort: { _id: 1 } },
//       ]);

//       const data = orders.map(({ _id, total, count }) => ({ date: _id, amount: total, count }));
//       res.render('admin/adminHome', { data });

//     }catch(err){
//         console.log(err.message);

//     }
// }

const adminHome = async (req, res) => {
  try {
    res.render("admin/adminHome");

    const orders = await orderModel.aggregate([
      { $match: { orderStatus: "Delivered" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const data = orders.map(({ _id, total, count }) => ({
      date: _id,
      amount: total,
      count,
    }));
    const today = moment().format("YYYY-MM-DD");
    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");
    const last7days = moment().subtract(7, "days").format("YYYY-MM-DD");
    const last30days = moment().subtract(30, "days").format("YYYY-MM-DD");
    const lastYear = moment().subtract(1, "years").format("YYYY-MM-DD");

    res.render("admin/adminHome", {
      data,
      today,
      yesterday,
      last7days,
      last30days,
      lastYear,
    });
  } catch (err) {
    console.log(err.message);
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
// const adminBlockUnblock = async(req,res)=>{
//     try{
//         const user = await userModel.findById(req.body.id);
//         if(!user){
//             return res.status(404).json({message:"User not found"});
//         }
//         if(user.isActive){
//             user.isActive = false;
//             console.log("User blocked");
//         }else{
//             user.isActive = true;
//             console.log("User unblocked");
//         }
//         await user.save();
//         res.json({status: true,message:"user blocked successsfully"});
//     }catch(err){
//         console.error(err);
//         res.status(500).json({message:"Interval server error"});

//     }
// }
const adminBlockUnblock = async (req, res) => {
  try {
    const userId = req.body.id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
        // delivery_date: ord.delivery_date,
        // Assuming there is a field called 'delivery_date'
        // return: ord.return.status,
        // Assuming there is a field called 'return' with a 'status' property
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

module.exports = {
  adminLogin,
  //adminLogout,
  verifyAdmin,
  adminHome,
  adminBlockUnblock,
  adminUsersList,
  salesreport,
  salesreportpost,
  adminDownloadReports,
};
