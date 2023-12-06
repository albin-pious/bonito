const { ObjectId } = require('mongodb');
const { getDb } = require('../config/dbConnect');
const Coupon = require('../models/couponModel');
const bcrypt = require('bcrypt');
const { paginate } = require('../helpers/pagination');

const loadCoupon = async(req,res)=>{
    const pageNum = parseInt(req.query.page,10)|| 1;
    const perPage = 5;
    try {
        const db = getDb();
        const couponCollection = db.collection('coupons');
        let { result: couponData, currentPage, totalPages, totalcount } = await paginate( couponCollection, pageNum, perPage );
        console.log('coupon data is: ',couponData);
        res.render('coupon',
            {
                couponData,
                currentPage,
                totalDocument: totalcount,
                pages: totalPages
            });
    } catch (error) {
        console.error('error occured while loading coupon page.');
    }
}

const loadCreateCoupon = async(req,res)=>{
    try {
        res.render('addCoupon');
    } catch (error) {
        console.error('error occured while loading coupon load. ',error);
    }
}

function generateCouponCode(){
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    let couponCode = '';
    for(let i=0;i<8;i++){
        const randomIndex = Math.floor(Math.random() * charset.length);
        couponCode += charset[randomIndex];
    }
    return couponCode;
}

const createCoupon = async (req, res) => {
    let { couponName, couponOffer, minAmount, validity, brand, category,status,apply } = req.body;
    try {
        const db = getDb();
        brand = brand.toUpperCase(); // Update to uppercase
        category = category.toUpperCase(); // Update to uppercase
        const couponCode = generateCouponCode();
        const couponCollection = db.collection('coupons');
        const brandCollection = db.collection('brand');
        const categoryCollection = db.collection('category');
        const existingCoupons = await couponCollection.findOne({ couponCode: couponCode });
        const brandExist = await brandCollection.findOne({ brandName: brand });
        const categoryExist = await categoryCollection.findOne({ categoryName: category });
        let expireDate = validity; // Ensure validity is in the correct format

        if (brand && !brandExist) {
            return res.render('addCoupon', { message: 'Please check brand name before adding coupon.' });
        }
        if (category && !categoryExist) {
            return res.render('addCoupon', { message: 'Please check category name before adding coupon.' });
        }
        if (!existingCoupons) {
            const newCoupon = new Coupon(couponName, couponCode, couponOffer, minAmount, expireDate, brand, category,status,apply);
            const result = await couponCollection.insertOne(newCoupon);
            if (result) {
                res.redirect('/admin/coupon');
            }else{
                res.render('addCoupon', { message: `Error: ${result.errmsg}`||'Some Internal problems occured please try again.' });
            }
        } else {
            return res.render('addCoupon', { message: 'Coupon already exists, try another one.' });
        }
    } catch (error) {
        console.error('Error occurred while creating coupon.', error);
        res.status(500).send('Internal Server Error'); // Send an HTTP response for the error
    }
};

const loadEditCoupon = async (req,res)=>{
    let id  = req.params.id;
    try {
        const db = getDb();
        const objectIdCouponId = new ObjectId(id);
        console.log('objectId: ',objectIdCouponId);
        const couponCollection = db.collection('coupons');
        const couponData = await couponCollection.findOne({ _id: objectIdCouponId });
        console.log('couponData is: ',couponData);
        if(couponData){
            res.render('editCoupon',{couponData});
        }else{
            res.render('coupon',{message:'Failed to load edit page.'});
        } 
    } catch (error) {
       console.log('Error occured while loading coupon edit.',error); 
    }
}

const editCoupon = async(req,res)=>{
    const {couponName,couponOffer,brand,category,minAmount,validity,status,apply,id} = req.body;
    try {
        const db = getDb();
        const couponCollection = db.collection('coupons');
        const objectIdCouponId = new ObjectId(id);
        const couponData = await couponCollection.findOne({ _id: objectIdCouponId });
        const couponCode = couponData.couponCode;
        const expireDate = validity;
        if(couponData){
            const couponCheck = await couponCollection.findOne({ couponCode, _id: { $ne: objectIdCouponId}});
            if(!couponCheck){
                const result = await couponCollection.updateOne({
                    _id:objectIdCouponId },
                    { $set: { couponName,couponCode,couponOffer,minAmount,expireDate,brand,category,status,apply}
                })

                if(result.modifiedCount === 1){
                    res.redirect('/admin/coupon');
                }else{
                    res.render('editCoupon',{ message: `Couldn't update the coupon try again later.`});
                }
            }else{
                return res.render('editCoupon',{ message: `Couponcode is taken to another coupon.`});
            }
        }
    } catch (error) {
        console.error('Error occured while editing coupon.',error);
    }
}

const deleteCoupon = async (req,res)=>{
    const id = req.params.id; 
    try {
        const db = getDb()
        const couponCollection = db.collection('coupons');
        const objectIdCouponId = new ObjectId(id);
        const result = await couponCollection.deleteOne({ _id: objectIdCouponId });
        if(result.deleteCoupon===1){
            res.json({ success: true, message: 'Coupon deleted successfully.'});
        }else{
            res.json({ success: true, message: 'Coupon deleted failted.'});
            console.log(`Brand deletion goes failed.`);
        }
    } catch (error) {
        console.log('Error occured while deleting coupon.',error);
    }
}

module.exports = {
    loadCoupon,
    loadCreateCoupon,
    createCoupon,
    loadEditCoupon,
    editCoupon,
    deleteCoupon
}