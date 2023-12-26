const mongoose = require("mongoose");
const db = 'mongodb+srv://user123:qIPf8fkvKUOh5zWd@cluster0.e5561a5.mongodb.net/escrunch';


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