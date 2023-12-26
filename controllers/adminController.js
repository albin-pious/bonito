const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel')
const { getDb } = require('../config/dbConnect');
const { ObjectId } = require('mongodb')
const dotenv = require('dotenv').config();
const multer = require('multer');
const { paginate } = require('../helpers/pagination');
const Order = require('../models/orderModel');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { count } = require('console');

const loadLogin = async(req,res)=>{
    try {
        console.log('session data is ',req.session.admin);
        if(!req.session.admin){
        return res.render('adminLogin',{title:'Bonito | Admin Login Page.'});
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
            res.render('dashboard',{title:'Bonito | Admin-Dashboard.'});
        }else{
            return res.render('adminLogin',{ message:'email or password are incorrect.',title:'Bonito | Admin Login Page.'})
        }
    } catch (error) {
        return res.status(500).json({message:'failed to send'})
    }
}

const loadHome = async(req,res)=>{
    try {
        res.render('dashboard',{title:'Bonito | Admin-Dashboard.'});
    } catch (error) {
        console.log('error occured while getting home',error);
    }
} 

const fetchlineChartData = async(req,res)=>{
    try {
        const db = getDb();
        const orderCollection = db.collection('order');
        const processData = await orderCollection.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$orderDate"}
                    },
                    count: { $sum:1}
                }
            },
            {
                $sort: {
                    _id: -1
                }
            },
            {
                $limit: 6
            },
            {
                $sort: {
                    _id: 1
                }
            }
        ]).toArray();
        res.json({ result: processData}) 
    } catch (error) {
        res.status(500).json({message:'An error occured.'}); 
        console.log('error occured while fetching data for line chart. ',error);
    }
} 

const fetchbarChartData = async(req,res)=>{
    try {
        const db = getDb();
        const orderCollection = db.collection('order');
        const processData = await orderCollection.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date:"$orderDate"}
                    },
                    totalPrice: { $sum: { $toInt: "$totalPrice"}}
                }
            },
            {
                $sort: {
                    _id: -1
                }
            },
            {
                $limit: 6
            },
            {
                $sort: {
                    _id: 1
                }
            }
        ]).toArray();
        console.log('processData ',processData);
        res.json({ result: processData});
    } catch (error) {
        res.status(500).json({message:'Error Occured.'});
        console.log('error occured while fetching data for bar chart. ',error);
    }
}

const fetchpieChartData = async(req,res)=>{
    try {
        const db = getDb();
        const orderCollection = db.collection('order');
        const processData = await orderCollection.aggregate([
            {
                $group: {
                    _id: '$paymentType',
                    count: {$sum: 1}
                }


            }
        ]).toArray();
        res.json({result:processData})
    } catch (error) {
        console.log('error occured while fetching data for pie chart. ',error);
    }
}

const exportPdfDailySales = async (req,res)=>{
    try {
        const db = getDb();
        const orderCollection = db.collection('order');
        const today = new Date().toISOString().split('T')[0];
        const todaysOrder = await orderCollection.aggregate([
            {
                $match: {
                    orderData: {
                        $gte: new Date(today),
                        $lt: new Date(today + 'T23:59:59.999Z')
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productDetails.item',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            }
        ]).toArray();
     
        console.log(`today ${today}`);

        console.log('data',todaysOrder);
        const orderData = {
            todaysOrders: todaysOrder
        }
        const filePathName = path.resolve(__dirname,"../views/admin/htmlToPdf.ejs");
        const htmlString = fs.readFileSync(filePathName).toString();
        const ejsData = ejs.render(htmlString,orderData);
        await createDailySalesPDF(ejsData);
        const pdfFilepath = 'DailySalesReport.pdf'
        const pdfData = fs.readFileSync(pdfFilepath);
        res.setHeader('Content-Type','application/pdf');
        res.setHeader('Content-Disposition','attachment; filename="DailySalesReport.pdf"');
        res.send(pdfData);
    } catch (error) {
        res.status(500).json({ message:'error occured in daily pdf report'})
        console.error(`error occured while exporting daily sales pdf. ${error}`);
    }
}

const createDailySalesPDF = async(html)=>{
    const browser = await puppeteer.launch({
        headless:"new",
        args: ['--no-sandbox','--disabled-setuid-sandbox']
    })
    const page = await browser.newPage();
    await page.setContent(html);
    await page.pdf({ path: 'DailySalesReport.pdf'});
    await browser.close();
}

const exportPdfWeeklySales = async (req,res)=>{
    try {
        const db = getDb();
        const orderCollection = db.collection('order');
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0,0,0,0);
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() - today.getDay() - 6);
        endOfWeek.setHours(23,59,59,999);

const todaysOrder = await orderCollection.aggregate([
            {
                $match: {
                    orderDate: {
                        $gte: endOfWeek,
                        $lt: startOfWeek
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productDetails.item',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            }
        ]).toArray();

        const orderData = {
            todaysOrders: todaysOrder
        }

        const filePathName = path.resolve(__dirname,"../views/admin/htmlToPdf.ejs");
        const htmlString = fs.readFileSync(filePathName).toString();
        const ejsData = ejs.render(htmlString,orderData);
        await createWeeklySalesPDF(ejsData);
        const pdfFilepath = 'WeeklySalesReport.pdf';
        const pdfData = fs.readFileSync(pdfFilepath);
        res.setHeader('Content-Type','application/json');
        res.setHeader('Content-Disposition','attachment; filename= "WeeklySalesReport.pdf"');
        res.send(pdfData);
    } catch (error) {
        res.status(500).json({ message:`error occured in daily pdf report ${error}`})
        console.error(`error occured while exporting weekly sales pdf. ${error}`);
    }
}

const createWeeklySalesPDF = async html=>{
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox','--disable-setuid-sandbox']
    })
    const page = await browser.newPage();
    await page.setContent(html);
    await page.pdf({path: 'WeeklySalesReport.pdf'});
    await browser.close();
}

const exportPdfYearlySales = async (req,res)=>{
    try {
        const db = getDb();
        const orderCollection = db.collection('order');
        const today = new Date();
        const year = today.getFullYear();
        const startOfYear = new Date(year,0,1);
        startOfYear.setHours(0,0,0,0);
        const endOfYear = new Date(year,11,31);
        endOfYear.setHours(23,59,59,999);

        console.log('start year: ',startOfYear);
        console.log('end year: ',endOfYear);

        const todaysOrder = await orderCollection.aggregate([
            {
                $match: {
                    orderDate: {
                        $gte: startOfYear,
                        $lt: endOfYear
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productDetails.item',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            }
        ]).toArray();  

        const testOrders = await orderCollection.find({
            orderDate: {
                $gte: startOfYear,
                $lt: endOfYear
            }
        }).toArray();

        console.log('Test Orders:', testOrders);

        const orderData = {
            todaysOrders:todaysOrder
        }
        const filePathName = path.resolve(__dirname,"../views/admin/htmlToPdf.ejs");
        const htmlString = fs.readFileSync(filePathName).toString();
        const ejsData = ejs.render(htmlString,orderData);
        await createYearlySalesPDF(ejsData);
        const pdfFilepath = 'YearlySalesReport.pdf';
        const pdfData = fs.readFileSync(pdfFilepath);
        res.setHeader('Content-Type','application/json');
        res.setHeader('Content-Disposition','attachment; filename= "YearlySalesReport.pdf"');
        res.send(pdfData);
    } catch (error) {
        res.status(500).json({ message:`error occured in yearly pdf report ${error}`});
        console.error(`error occured while exporting daily sales pdf. ${error}`);
    }
}

const createYearlySalesPDF = async html=>{
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox','--disable-setuid-sandbox']
    })
    const page = await browser.newPage();
    await page.setContent(html);
    await page.pdf({path: 'YearlySalesReport.pdf'});
    await browser.close();
}

const loadProductList = async(req,res)=>{
    const pageNum = parseInt(req.query.page,10)|| 1;
    const perPage = 3;
    try {
        console.log('rendering product view');
        const db = getDb();
        const productCollection = await db.collection('products');
        let { result: productData, currentPage, totalPages, totalcount } = await paginate( productCollection, pageNum, perPage );
        
        const brandCollection = await db.collection('brand');
        const brandData = await brandCollection.find().toArray();
        res.render('productView',{
            productData,
            brandData,
            currentPage,
            totalDocument: totalcount,
            pages: totalPages,
            title:'Bonito | Admin-Products View.'
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
        res.render('addProducts',{catData:catData,brandData:brandData,title:'Bonito | Admin-Addproducts Page.'});
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
            return res.render('addProducts',{message:'Product is already existing',title:'Bonito | Admin-AddProducts Page.'});
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
        res.render('editProduct',{
            title:'Bonito | Admin-Editproducts page.',
            productData,
            catData,
            brandData,
        }
        );
    } catch (error) {
        console.error('Error Occured while loading edit product',error);
        res.status(500).send('Internal Server Error',error);
    }
}

const editProduct = async (req, res) => {
    try {
        const {
            id,
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
        // Validate input data, e.g., required fields, data types, etc.
        const db = getDb();
        const productCollection = db.collection('products');
        const productData = await productCollection.findOne({_id: new ObjectId(id)});
        const previousImages = productData.images;
        console.log('hai 2');
        // const existingProduct = await productCollection.findOne({ _id: id });

        // if (!existingProduct) {
        //     // Handle the case where the product with the given ID is not found
        //     return res.status(404).send('Product not found');
        // }

        const title = name.toUpperCase();

        // Check for duplicate titles, excluding the current product being edited
        const proCheck = await productCollection.findOne({
            $and: [
                { _id: { $ne: new ObjectId(id) } },
                { title: title },
            ],
        });
        const sizeUnits = {
            S:size_s!==undefined?unit_s:undefined,
            M:size_m!==undefined?unit_m:undefined,
            L:size_l!==undefined?unit_l:undefined,
            XL:size_xl!==undefined?unit_xl:undefined,
            XXL:size_xxl!==undefined?unit_xxl:undefined
        }
        Object.keys(sizeUnits).forEach(key=>sizeUnits[key]===undefined && delete sizeUnits[key]);
        console.log(name,description,categoryId,gender,price,stock,sizeUnits);
        const images = req.files ? req.files.map(file => file.filename) : undefined;
        let updatedProduct;
        if (!proCheck) {
            // Update the product data in the database
            if(images && images.length > 0){
                updatedProduct = {
                title,
                description,
                price,
                gender,
                categoryId,
                stock,
                offer,
                sizeUnits,
                brand,
                images
            };
            }else{
                updatedProduct = {
                    title,
                    description,
                    price,
                    gender,
                    categoryId,
                    stock,
                    offer,
                    sizeUnits,
                    brand,
                    images:previousImages
                }
            }
             console.log(updatedProduct);
            // Use $set to update specific fields in the document
            const result = await productCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedProduct }
            );
            // Redirect to the product details page or a success page
            if(result.modifiedCount ===1){
                res.redirect(`/admin/productlist`);
            }else{
                res.json({message:'Error occured while editing product'})
            }
        } else {
            // Handle the case where the new title is a duplicate
            return res.render('editProduct', { message: 'Duplicate title',title:'Bonito | Admin-Editproducts page.' });
        }
    } catch (error) {
        console.log('Error occurred while editing the product data: ', error);
        res.status(500).send('Internal server problem.');
    }
}

const deleteProduct = async (req,res)=>{
    const {id} = req.params;
    try {
        console.log('entered deleting product');
        console.log('product id is: ',id);
        const db = getDb();
        const collection = db.collection('products');
        const objectIdProductId = new ObjectId(id);
        console.log('objectId ',objectIdProductId);
        const result = await collection.deleteOne({ _id: objectIdProductId });

        if (result.deletedCount === 1) {
            console.log('Product deleted successfully.');
            res.json({ success: true, message: 'Product deleted successfully.' });
        } else {
            console.log('Product not found or not deleted.');
            res.status(404).json({ success: false, message: 'Product not found or not deleted.' });
        }
    } catch (error) {
        console.log('error occured while deleting product. ',error);
    }
}

const deleteSelectedProducts = async(req,res)=>{
    try {
        const db = getDb();
        const collection = db.collection('products');
        console.log('multiple delete loaded');
        const Ids = req.params.Ids.split(',');
        console.log('selected ids',Ids);
        const objectIdProductIds = Ids.map(id =>new ObjectId(id));
        console.log('objectIdProductIds',objectIdProductIds);
        const result = await collection.deleteMany({_id: { $in: objectIdProductIds}});
        if(result.deletedCount === 1){
            console.log('Products deleted successfully.');
            res.json({ success: true, message: 'Products deleted successfully.' });
        }else{
            res.json({success:false, message: 'Products deleted failed'})
        }
    } catch (error) {
        console.error('error occured while deleting multiple products: ',error);
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
        const brandsWithCatName = await Promise.all(brandData.map(async brand => {
            if (brand.categoryId && Array.isArray(brand.categoryId)) {
                const categoryNames = await Promise.all(brand.categoryId.map(async categoryId => {
                    const category = await catCollection.findOne({ '_id': new ObjectId(categoryId) });
                    return category ? category.categoryName : 'Unknown Name';
                }));
        
                return {
                    _id: brand._id,
                    brandName: brand.brandName,
                    categoryNames: categoryNames
                };
            } else if (brand.categoryId) {
                // If categoryId exists but is not an array, fetch the category name directly
                const category = await catCollection.findOne({ '_id': new ObjectId(brand.categoryId) });
                const categoryName = category ? category.categoryName : 'Unknown Name';
        
                return {
                    _id: brand._id,
                    brandName: brand.brandName,
                    categoryNames: [categoryName]
                };
            } else {
                // If categoryId doesn't exist, set categoryNames to ['Unknown Category']
                return {
                    _id: brand._id,
                    brandName: brand.brandName,
                    categoryNames: ['Unknown Category']
                };
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
                brandPages:totalBrandPage,
                title:'Bonito | Admin-Category page.'
            });
        } else {
            res.render('categoryView', { catData: catData, title:'Bonito | Admin-Category.' });
        }
    } catch (error) {
        console.log('Error occurred in loading categoryList', error);
        res.status(500).json('Error loading productView');
    }
}

const loadCreateCategory = async(req,res)=>{
    try {
        res.render('addCategory',{title:'Bonito | Admin-Category Add Page.'});
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
        res.render('category_create',{message:'Category already exists.',title:'Bonito | Admin-Category Add Page.'})
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
            res.render('editCategory',{data:catData,title:'Bonito | Admin-Category Edit Page.'});
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
            res.render('addBrand',{data:catData,title:'Bonito | Admin-Brand Add Page.'});
        }else{
            res.render('addBrand',{data:catData,title:'Bonito | Admin-Brand Add Page.'});
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
            res.render('addBrand',{title:'Bonito | Admin-Brand Add Page.',data:brandData});
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
                title:'Bonito | Admin-Brand Edit Page.'
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
                return res.render('editBrand',{title:'Bonito | Admin-Brand Edit Page.'})
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
        res.render('customerView',
            {
                userData,
                currentPage,
                totalDocument: totalcount,
                pages: totalPages,
                title:'Bonito | Admin-Customer View Page.'
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

const adminLogout = async(req,res)=>{
    try {
        delete req.session.admin;
        res.redirect('/admin');
    } catch (error) {
        console.log('error occured during logout: ',error);
    }
}

const loadOrder = async(req,res)=>{
    const pageNum = parseInt(req.query.page,10) || 1;
    const perPage = 5;
    const skipValue = (pageNum-1) * perPage;
    try {
        const db = getDb();
        const orderCollection = db.collection('order');
        const order = await orderCollection.aggregate([
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
              }
            },
            {
              $unwind: '$user'
            },
            {
              $lookup: {
                from: 'products',
                localField: 'productDetails.item',
                foreignField: '_id',
                as: 'productDetails'
              }
            },
            {
              $unwind: '$productDetails' 
            },
            {
              $sort: {
                'productDetails.fieldToSortBy': -1
              }
            }
        ]).skip(skipValue).limit(perPage).toArray();
        let count = await orderCollection.countDocuments();
        const totalPage = Math.ceil(count/perPage);
        const currentPage = Math.max(1,Math.min(pageNum,totalPage))
        console.log('order is: ',order);
        res.render('orders',{
            title:'Bonito | Admin-Order View Page.',
            orderData: order,
            currentPage,
            totalDocument: count,
            pages: totalPage
        });
    } catch (error) {
        console.log('error occured while loaing order ',error);
    }
}

const editStatus = async(req,res)=>{
    try {
        const db = getDb();
        const orderCollection = db.collection('order');
        const status = req.body.statusvalue;
        const orderId = new ObjectId(req.body.id);
        const result = await orderCollection.updateOne({
            _id:orderId
        },
        {
            $set:{
                status: status
            }
        });

        if(result){
            res.json({status:true})
        }else{
            res.json({status:false})
        }
    } catch (error) {
        console.error('error occured while updating status',error);
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
    loadOrder,
    addNewProduct,
    addNewBrand,
    addNewCategory,
    catForBrand,
    editProduct,
    editCategory,
    editBrand,
    editStatus,
    deleteCategory,
    deleteBrand,
    deleteProduct,
    deleteSelectedProducts,
    restrictUser,
    adminLogout,
    fetchlineChartData,
    fetchbarChartData,
    fetchpieChartData,
    exportPdfDailySales,
    exportPdfWeeklySales,
    exportPdfYearlySales
}