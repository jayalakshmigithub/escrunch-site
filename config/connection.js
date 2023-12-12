const mongoose = require("mongoose");
const db = 'mongodb://127.0.0.1:27017/escrunch';


const connectDB = () => {
    return mongoose.connect(db)
    .then(() => {
        console.log("mongodb connected");
    })
    .catch((err) => {
        console.log("mongodb connection error", err);
    })
 }

module.exports = connectDB;