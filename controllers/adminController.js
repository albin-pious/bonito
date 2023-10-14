const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel')
const { getDb } = require('../config/dbConnect');
const { ObjectId } = require('mongodb')
const dotenv = require('dotenv').config();
const multer = require('multer');
const { paginate } = require('../helpers/pagination');

const loadLogin = async(req,res)=>{
    try {
        console.log('session data is ',req.session.admin);
        if(!req.session.admin){
        return res.render('adminLogin');
        }else{
            return res.redirect('/admin/dashboard');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async(req,res)=>{
    console.log('hai1');
    const credential = {
        email:process.env.ADMIN_EMAIL,
        password:process.env.ADMIN_PASSWORD,
        role:process.env.ADMIN_ROLE
    }
    console.log('hai2');
    const adminEmail = req.body.email;
    const adminPassword = req.body.password;
    console.log('hai 3');
    console.log('request session is',req.session);
    try {
        if(adminEmail===credential.email && adminPassword === credential.password){
            req.session.admin = {
                email:adminEmail,
                role:credential.role
            };
            console.log('this was ',req.session.admin);
            console.log('final');
            res.render('dashboard');
        }else{
            return res.render('adminLogin',{ message:'email or password are incorrect.'})
        }
    } catch (error) {
        return res.status(500).json({message:'failed to send'})
    }
}

const loadHome = async(req,res)=>{
    try {
        res.render('dashboard');
    } catch (error) {
        console.log('error occured while getting home',error);
    }
}

const loadProductList = async(req,res)=>{
    const pageNum = parseInt(req.query.page,10)|| 1;
    const perPage = 5;
    try {
        console.log('rendering product view');
        const db = getDb();
        const productCollection = await db.collection('products');
        let { result: productData, currentPage, totalPages, totalcount } = await paginate( productCollection, pageNum, perPage );
        productData = await productData.toArray();
        const brandCollection = await db.collection('brand');
        const brandData = await brandCollection.find().toArray();
        // console.log('product collection is ',productData);
        res.render('productView',{
            productData,
            brandData
        });
    } catch (error) {
        console.log('error occures in loading productlist',error);
        res.status(500).json('error loading productView');
    }
}

const loadProductAdd = async(req,res)=>{
    try {
        const db = getDb();
        const catCollection = db.collection('category');
        const brandCollection = db.collection('brand');
        const catData = await catCollection.find().toArray();
        const brandData = await brandCollection.find().toArray();
        res.render('addProducts',{catData:catData,brandData:brandData});
    } catch (error) {
        console.log('error to loading product edit ',error);
        res.status(500).json({error:'Internal server problem. '});
    }
}

const addNewProduct = async (req,res)=>{
    const { 
        name,
        description,
        categoryId,
        gender,
        price,
        offer,
        stock,
        brand,
        size_s,
        size_m,
        size_l,
        size_xl,
        size_xxl,
        unit_s,
        unit_m,
        unit_l,
        unit_xl,
        unit_xxl,
    } = req.body;
    console.log('data in req body: ',req.body);
    try {
        const db = getDb();
        const croppedImages = req.body.croppedImages || [];
        console.log('croppedImage is: ',croppedImages);
        const productCollection = db.collection('products');
        const title = name.toUpperCase();
        const proCheck = await productCollection.findOne({title});
        if(!proCheck){
            
            const sizeUnits = {
                S:size_s!==undefined?unit_s:undefined,
                M:size_m!==undefined?unit_m:undefined,
                L:size_l!==undefined?unit_l:undefined,
                XL:size_xl!==undefined?unit_xl:undefined,
                XXL:size_xxl!==undefined?unit_xxl:undefined
            }
            Object.keys(sizeUnits).forEach(key=>sizeUnits[key]===undefined && delete sizeUnits[key]);
            console.log(name,description,categoryId,gender,price,stock,sizeUnits);
            
            const images = req.files.map((file)=>{
                return file.filename;
            })
            console.log('uploaded images are',images);
            const newProduct = new Product(title,description,price,gender,categoryId,stock,offer,sizeUnits,brand,images);
            const result = await productCollection.insertOne(newProduct);
            res.redirect('/admin/productlist');
        }else{
            return res.render('addProducts',{message:'Product is already existing'});
        }
    } catch (error) {
        console.log('error occured while creating product ',error);
        res.status(500).send('Internal server problem.')
    }
}

const loadEditProduct = async(req,res)=>{
    const { id } = req.params;
    try {
        console.log('productid from params: ',id);
        const db = getDb();
        const productCollection = db.collection('products');
        const brandCollection = db.collection('brand');
        const categoryCollection = db.collection('category');
        let objectIdProductId = new ObjectId(id);
        console.log('object id was: ',objectIdProductId);
        const productData = await productCollection.findOne({_id:objectIdProductId});
        const brandData = await brandCollection.find().toArray();
        const catData = await categoryCollection.find().toArray();
        console.log('product data is ',productData);
        res.render('editProduct',{
            productData,
            catData,
            brandData
        }
        );
    } catch (error) {
        console.error('Error Occured while loading edit product',error);
        res.status(500).send('Internal Server Error',error);
    }
}

const catForBrand = async (req, res) => {
    try {
        console.log('Rendering categories for brand');
        const db = getDb();
        const brandCollection = db.collection('brand');
        const brandId = req.params.brandId;
        console.log('Brand ID is', brandId);
  
        const brandData = await brandCollection.findOne({ _id: new ObjectId(brandId) });
        if (!brandData) {
            return res.status(404).json({ error: 'Brand not found.' });
        }
  
        const catCollection = db.collection('category');
        const brandsWithCatName = [];
  
        if (brandData.categoryId && Array.isArray(brandData.categoryId)) {
            for(const categoryId of brandData.categoryId) {
                console.log('category id is: ', categoryId);
                const category = await catCollection.findOne({ '_id': new ObjectId(categoryId) });
                if (category && category._id.toString() === categoryId) {
                    const categoryWithId = {
                        ...category,
                        categoryId: categoryId
                    };
                    brandsWithCatName.push(categoryWithId);
                }
            }
        }else {
            const categoryId = brandData.categoryId;
            const category = await catCollection.findOne({ '_id': new ObjectId(categoryId) });
            if (category && category._id.toString() === categoryId) {
                const categoryWithId = {
                    ...category,
                    categoryId: categoryId
                };
                brandsWithCatName.push(categoryWithId);
            }
        }
        console.log('Brand-wise cat data is ', brandsWithCatName);
        res.json(brandsWithCatName);
    }catch (error) {
        console.error('Error fetching categories for brand:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


  const loadCategory = async (req, res) => {
    const catPageNum = parseInt(req.query.catpage,10) || 1;
    const perPage = 5;
    const catSkipValue = (catPageNum - 1) * perPage;
    try {
        // category related. 
        const db = getDb();
        const catCollection = db.collection('category');
        const catCount = await catCollection.countDocuments();
        const catData = await catCollection.find().skip(catSkipValue).limit(perPage).toArray();
        const totalCatPage = Math.ceil(catCount / perPage);
        const currentCatPageCount = Math.max(1,Math.min(catPageNum,totalCatPage));
        
        // brand related.
        const brandPageNum =  parseInt(req.query.brandPage,10) || 1;
        const brandSkipValue = (brandPageNum - 1) * perPage;       
        const brandCollection = db.collection('brand');
        const brandCount = await brandCollection.countDocuments();
        const brandData = await brandCollection.find().skip(brandSkipValue).limit(perPage).toArray();
        const totalBrandPage = Math.ceil(brandCount / perPage);
        const currentBrandPageCount = Math.max(1,Math.min(brandPageNum,totalBrandPage));
        const brandsWithCatName = await Promise.all(brandData.map(async brand =>{
            if(brand.categoryId && Array.isArray(brand.categoryId)){
                const categoryNames = await Promise.all(brand.categoryId.map(async categoryId =>{
                    const category = await catCollection.findOne({'_id':new ObjectId(categoryId)})
                    return category?category.categoryName:'Unknown Name';
                }));
            return{
                _id:brand._id,
                brandName:brand.brandName,
                categoryNames:categoryNames
            }
        }else{
            return{
                _id:brand._id,
                brandName:brand.brandName,
                categoryNames: ['Unknown Category']
            }
        }    

        }));
        console.log('brand with cat is ',brandsWithCatName);
        if (catData.length > 0) {
            res.render('categoryView', { 
                catData: catData,  
                title: '',
                currentCatPage:currentCatPageCount,
                totalCatDocument:catCount,
                catpages:totalCatPage,
                brand: brandsWithCatName || [] ,
                currentBrandPage:currentBrandPageCount,
                totalBrandPage:totalBrandPage,
                brandPages:totalBrandPage
            });
        } else {
            res.render('categoryView', { catData: catData, title: 'Category list is empty.' });
        }
    } catch (error) {
        console.log('Error occurred in loading categoryList', error);
        res.status(500).json('Error loading productView');
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
    
    let {categoryName} = req.body;
    categoryName = categoryName.toUpperCase();
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
    let { categoryName, _id } = req.body;
    categoryName = categoryName.toUpperCase();
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

const deleteCategory = async (req, res) => {
    try {
        console.log('Deleting category...');
        const db = getDb();
        const collection = db.collection('category');
        const categoryId = req.params.id;
        console.log('Category ID:', categoryId);

        const ObjectIdCategoryId = new ObjectId(categoryId);
        console.log('Object ID for Category:', ObjectIdCategoryId);

        const result = await collection.deleteOne({ _id: ObjectIdCategoryId });

        if (result.deletedCount === 1) {
            console.log('Category deleted successfully.');
            // res.redirect('/admin/categorylist');
            res.json({ success: true, message: 'Category deleted successfully.' });
        } else {
            console.log('Category not found or not deleted.');
            // res.redirect('/admin/categorylist');
            res.status(404).json({ success: false, message: 'Category not found or not deleted.' });
        }

    } catch (error) {
        console.error('Error occurred while deleting category:', error);
        res.status(500).send('Internal server error.');
    }
};


const loadBrandAdd = async(req,res)=>{
    try {
        const db = getDb();
        const collection = db.collection('category');
        const catData = await collection.find().toArray();
        if(catData){
            res.render('addBrand',{data:catData,title:''});
        }else{
            res.render('addBrand',{data:catData,title:'category is empty.'});
        }
        
    } catch (error) {
        console.log('error occures while loading brand page.');
    }
}

const addNewBrand = async(req,res)=>{
    let {brandName,categoryId}=req.body;
    try {
        const db = getDb();
        const collection = db.collection('brand');
        const brandData = await collection.find().toArray();
        brandName=brandName.toUpperCase();
        const brandCheck = await collection.findOne({brandName});
        if(!brandCheck){
            const newBrand = new Brand(brandName,categoryId);
            const result = await newBrand.save();
            res.redirect('/admin/categorylist')
        }else{
            res.render('addBrand',{title:'Brand is already existing.',data:brandData});
        }
    } catch (error) {
        console.log(error.message);
    }
}

const LoadEditBrand = async(req,res)=>{
    try {
        const db = getDb();
        const brandCollection = await db.collection('brand');
        const catCollection = await db.collection('category');
        const brandId = req.params.id;
        const ObjectIdCategoryId = new ObjectId(brandId);
        const catData = await catCollection.find().toArray();
        const brandData = await brandCollection.findOne({_id:ObjectIdCategoryId})
        if(catData){
            return res.render('editBrand',{
                catData:catData,
                data:brandData,
                title:'no category'
            });
        }else{
            return res.status(404).send('Brand data not found');
        }
    } catch (error) {
        console.log('error occured ',error);
        return res.status(500).send('Error occurred while fetching brand data');
    }
}

const editBrand = async(req,res)=>{
    let {brandName,categoryId,_id} = req.body;
    console.log('id from edit post req: ',_id);
    brandName = brandName.toUpperCase();
    const ObjectIdBrandId = new ObjectId(_id)
    try {
        const db = getDb();
        const brandCollection = db.collection('brand');
        const brandData = await brandCollection.findOne({_id:ObjectIdBrandId});
        if(brandData){
            const brandCheck = await brandCollection.findOne({ brandName, _id: { $ne: ObjectIdBrandId } });
            if(!brandCheck){
                const result = await brandCollection.updateOne({
                    _id:ObjectIdBrandId},
                    {$set: { brandName,categoryId:categoryId}
                })

                if(result.modifiedCount === 1){
                    res.redirect('/admin/categorylist');
                }
            }else{
                return res.render('editBrand',{title:'Brand name is already existing.'})
            }
        }
    } catch (error) {
        console.log('error occured during edit brand: ',error);
    }
}

const deleteBrand = async(req,res)=>{
    try {
        console.log('deletion is started...');
        const db = getDb();
        const collection = db.collection('brand');
        const id = req.params.id;
        console.log('id is for deleting.. ',id);
        const ObjectIdBrandId = new ObjectId(id);
        console.log('object brand id is ',ObjectIdBrandId);
        const result = await collection.deleteOne({_id:ObjectIdBrandId});
        if(result.deletedCount===1){
            res.json({ success: true, message: 'Category deleted successfully.' });
        }else{
            res.json({ success: true, message: 'Category deleted failed.' });
            console.log(`brand deletion goes failed.`);
        }
    } catch (error) {
        console.log('error occured while deleting the brand. ',error);
    }
}

const loadCustomer = async(req,res)=>{
    const pageNum = parseInt(req.query.page,10)|| 1;
    const perPage = 4;
    try {
        const db = getDb();
        const userCollection = db.collection('users');
        let { result: userData, currentPage, totalPages, totalcount } = await paginate( userCollection, pageNum, perPage );
        userData = await userData.toArray();
        res.render('customerView',
            {
                userData,
                currentPage,
                totalDocument: totalcount,
                pages: totalPages
            }
        ); 
    } catch (error) {
       console.log('error occured while loading customer ',error); 
    }
}

const restrictUser = async(req,res)=>{
    const {action,id}=req.params;
    try {
        console.log('action is',action,'id is ',id);
        const db = getDb();
        const collection = db.collection('users');
        const ObjectIdUserId = new ObjectId(id);
        const userData = await collection.findOne({_id:ObjectIdUserId});
        console.log(userData);
        let updateQuery;
        if(userData){
            if(action === 'block'){
                updateQuery = { $set: { blocked: true }};
            }else if(action === 'unblock'){
                updateQuery = { $set: { blocked: false }};
            }
            const result = await collection.updateOne({_id:ObjectIdUserId},updateQuery);
            if (result.matchedCount === 1) {
                const updatedUserData = await collection.findOne({_id:ObjectIdUserId})
                if (result.modifiedCount === 1) {
                  res.json({ message: `User ${action}ed Successfully`, userStatus: updatedUserData.blocked });
                } else {
                  res.json({ message: `User is already ${action}ed` });
                }
            } else {
                res.status(404).json({ error: 'User not found.' });
            }
        }
    } catch (error) {
        console.error('Error Occured while user block or unblock.',error);
        res.status(500).json({ error: 'Internal server error.' });
    }
}


module.exports = {
    verifyLogin,
    loadLogin,
    loadHome,
    loadProductList,
    loadProductAdd,
    loadCategory,
    loadCustomer,
    loadCreateCategory,
    LoadEditBrand,
    loadeditCategory,
    loadEditProduct,
    loadBrandAdd,
    addNewProduct,
    addNewBrand,
    addNewCategory,
    catForBrand,
    editCategory,
    editBrand,
    deleteCategory,
    deleteBrand,
    restrictUser
}