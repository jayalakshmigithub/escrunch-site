const express = require('express')
const bodyParser = require("body-parser");
const session = require("express-session")
const mongodbConnect = require("./config/connection");
const app = express();
const dotenv = require("dotenv").config();
const path = require("path");
const logger = require("morgan");
const ejs = require("ejs");
const fs = require("fs");


//set view engine and views directory
app.set("view engine", "ejs");
app.set("views", "./views");


mongodbConnect().then(() => {
  console.log("database connected successfully")
}).catch((err) => {
  console.error('Error connecting to database:', err);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: true,
    
  })
);

//for user
const userRouter = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoutes');

app.use("/", userRouter);
app.use('/admin', adminRoute);



app.listen(3008, () => {
  console.log('server is running')
})
module.exports = app;