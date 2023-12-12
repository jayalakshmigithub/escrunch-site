const categoryModel = require('../model/categoryModel');
const dbConnect = require("../config/connection");
const bcrypt = require("bcrypt");

const addCategory = (category)=>{
    console.log('In add category helper function');
    return new Promise((resolve,reject)=>{
        dbConnect().then(()=>{
            categoryModel.create(category)
            .then(()=>{
                resolve();
            })
            .catch((error)=>{
                console.log('failed to add category');
                reject(error)
            })
        })
    })
}
module.exports = {
    addCategory
}