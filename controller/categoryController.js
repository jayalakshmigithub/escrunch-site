const sharp = require('sharp');
const categoryModel = require('../model/categoryModel');
const categoryHelper = require('../helper/categoryHelper');
const { configDotenv } = require('dotenv');


//---------------- To display the category list page for admin-----------------

const adminCategory = async (req, res) => {
    try {
        const category = await categoryModel.find()
        res.render('admin/adminCategory', { data: category })

    } catch (err) {
        console.log(err.message);

    }
}
//----------to render add category page of admin----------

const adminAddCategoryPage = async (req, res) => {
    try {
        res.render('admin/adminAddCategory')
    } catch (err) {
        console.log(err.message);
    }
}


//--------to add category to db by admin
const adminAddCategory = async (req, res) => {
    try {
        const newCategory = req.body;

        // Check if the category already exists
        const existingCategory = await categoryModel.findOne({ categoryname: newCategory.categoryname });

        if (existingCategory) {
            // Category already exists, handle the error
            return res.status(400).send('Category already exists');
        }

        // Add the category to the database if it doesn't exist
        await categoryHelper.addCategory(newCategory);
        res.redirect('/admin/adminCategory');

    } catch (err) {
        console.error('Failed to add category:', err);
        res.status(500).send('Internal server error');
    }
};


//to edit category page of admin-------

const adminEditCategoryPage = async (req, res) => {
    try {
        const categoryId = req.query._id;
        const category = await categoryModel.findById(categoryId);
        res.render('admin/adminEditCategory', { category });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ success: false, message: 'server error' });
    }
}
//---------To edit category by admin------
const adminEditCategory = async (req, res) => {
    try {
        const category = req.body;
        const categoryId = req.body.id;
        console.log(categoryId);
        console.log(category);

        //Update the product with the new data---
        await categoryModel.findByIdAndUpdate(categoryId, { new: true });
        const updatedCategory = await categoryModel.findById(categoryId);
        updatedCategory.categoryname = req.body.categoryname;
        updatedCategory.description = req.body.description;
        await updatedCategory.save();
        res.redirect('/admin/admincategory');

    } catch (err) {
        console.log(err.message);
    }
}


const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.query._id; // Retrieve the category ID from query parameters
        console.log('Deleting category with ID', categoryId);

        // Use correct field to specify the category ID in the query
        await categoryModel.deleteOne({ _id: categoryId });
        res.redirect('/admin/adminCategory');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal server error');
    }
};



module.exports = {
    adminCategory,
    adminAddCategoryPage,
    adminAddCategory,
    adminEditCategoryPage,
    adminEditCategory,
    deleteCategory

}