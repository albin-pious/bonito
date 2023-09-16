const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const { getDb } = require('../config/dbConnect');
const { ObjectId } = require('mongodb')
const dotenv = require('dotenv').config();
const multer = require('multer');

const loadLogin = async(req,res)=>{
    try {
        res.render('adminLogin');
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async(req,res)=>{
    const credential = {
        email:process.env.ADMIN_EMAIL,
        password:process.env.ADMIN_PASSWORD
    }
    const adminEmail = req.body.email;
    const adminPassword = req.body.password;
    try {
        if(adminEmail===credential.email && adminPassword === credential.password){
            req.session.admin = req.body.email;
            req.session.admin.role = 'Admin';
            res.render('dashboard');
        }else{
            return res.render('adminLogin',{ message:'email or password are incorrect.'})
        }
    } catch (error) {
        return res.status(500).json({message:'failed to send'})
    }
}

const loadProductList = async(req,res)=>{
    try {
        console.log('rendering product view');
        res.render('productView');
    } catch (error) {
        console.log('error occures in loading productlist',error);
        res.status(500).json('error loading productView');
    }
}

const loadProductAdd = async(req,res)=>{
    try {
        const db = getDb();
        const collection = db.collection('category');
        const catData = await collection.find().toArray();
        res.render('addProducts',{catData:catData});
    } catch (error) {
        console.log('error to loading product edit ',error);
        res.status(500).send('error occures while load edit product');
    }
}

const addNewProduct = async (req,res)=>{
    const { name,description,categoryId,gender,price,offer_price,stock,sizes,color,images } = req.body;
    try {
        const sizesArray = Array.isArray(sizes)?sizes:[sizes];
        const db = getDb();
        const collection = db.collection('products');
    } catch (error) {
        console.log('error occured while creating product ',error);
        res.status(500).send('Internal server problem.')
    }
}

const loadCategory = async(req,res)=>{
    try {
        const db = getDb();
        const collection = db.collection('category');
        const catData = await collection.find().toArray();
        if(catData.length > 0){
            res.render('categoryView',{data:catData , title:''});
        }else{
            res.render('categoryView',{data:catData, title:'Category list is empty.'});
        }
    } catch (error) {
        console.log('error occures in loading categoryList',error);
        res.status(500).json('error loading productView');
    }
}

const loadCreateCategory = async(req,res)=>{
    try {
        res.render('addCategory');
    } catch (error) {
        console.log(error.message);
    }
}

const addNewCategory = async(req,res)=>{
    console.log('hai');
    const {categoryName} = req.body;
    console.log(categoryName);
    try {
       const db = getDb();
       const collection = db.collection('category');
       const catCheck = await collection.findOne({categoryName});
       if(!catCheck){
        const newCat = new Category(categoryName);
        const result = await collection.insertOne(newCat)
        res.redirect('/admin/categorylist')
       }else{
        res.render('category_create',{message:'Category already exists.'})
       }
    } catch (error) {
        console.log('Error creating category ',error);
        res.status(500).json({message:'error occured while creating category'});
    }

}

const loadeditCategory = async(req,res)=>{
    try {
        const db = getDb();
        const collection = db.collection('category');
        const categoryId = req.params.id;
        const ObjectIdCategoryId = new ObjectId(categoryId);
        const catData = await collection.findOne({_id:ObjectIdCategoryId});
        if(catData){
            res.render('editCategory',{data:catData});
        }else{
            console.log('category not found.');
        }
    } catch (error) {
        console.log('error occured while edit category',error);
    }
}

const editCategory = async (req, res) => {
    const { categoryName, _id } = req.body;
    console.log('_id:', _id);

    try {
        const db = getDb();
        const collection = db.collection('category');
        const categoryId = _id;
        console.log('Category Id is', categoryId);
        const ObjectIdCategoryId = new ObjectId(categoryId);

        const catData = await collection.findOne({ _id: ObjectIdCategoryId });
        console.log(catData);

        if (catData) {
            const catCheck = await collection.findOne({ categoryName, _id: { $ne: categoryId } });
            if (!catCheck) {
                const result = await collection.updateOne(
                    { _id: ObjectIdCategoryId },
                    { $set: { categoryName } }
                );

                if (result.modifiedCount === 1) {
                    res.redirect('/admin/categorylist');
                } else {
                    console.log('Category not updated.');
                }
            } else {
                console.log('Category name is not unique.');
            }
        } else {
            console.log('Category not found.');
        }
    } catch (error) {
        console.error('Error occurred while editing category', error);
    }
};

const deleteCategory = async(req,res)=>{
    try {
        console.log('hai from delete');
        if(!req.query.confirm){
            res.redirect('/admin/categorylist');
            return;
        }
        const db = getDb();
        const collection = db.collection('category');
        const categoryId = req.params.id;
        const ObjectIdCategoryId = new ObjectId(categoryId);
        const result = await collection.deleteOne({_id:ObjectIdCategoryId});
        if(result.deletedCount === 1){
            res.redirect('/admin/categorylist');
        }else{
            console.log('Category not found or not deleted.');
            res.redirect('/admin/categorylist');
        }    
        
    } catch (error) {
        console.log('error occured while deleting. ',error);
        res.status(500).send('internal server error.');
    }
}


module.exports = {
    loadLogin,
    verifyLogin,
    loadProductList,
    loadProductAdd,
    addNewProduct,
    loadCategory,
    loadCreateCategory,
    addNewCategory,
    loadeditCategory,
    editCategory,
    deleteCategory
}