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
        minAmount = parseInt(minAmount);
        couponOffer = parseInt(couponOffer);
        validity = parseInt(validity);
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
    let {couponName,couponOffer,brand,category,minAmount,validity,status,apply,id} = req.body;
    try {
        minAmount = parseInt(minAmount);
        couponOffer = parseInt(couponOffer);
        validity = parseInt(validity);

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

const loadUserCoupon = async (req,res)=>{
    try {
        const db = getDb();
        const userCollection = db.collection('users');
        const userId = req.session.user._id;
        const objectIdUserId = new ObjectId(userId);
        const userData = await userCollection.findOne({ _id:objectIdUserId});
        console.log('user data is: ',userData);
        res.render('userCoupon',{userData});
    } catch (error) {
        console.log('error occured while loading coupon page.',error);
        res.json({status:500,message:'Internal Server Problem'});
    }
}

const applyCoupon = async (req, res) => {
    let { userId, coupon,total } = req.body;
    total = parseInt(total);
    try {
        const db = getDb();
        const userCollection = db.collection('users');
        const cartCollection = db.collection('cart');
        const objectIdUserId = new ObjectId(userId);
        const userData = await userCollection.findOne({ _id: objectIdUserId });
        const cartData = await cartCollection.findOne({ userId: objectIdUserId});
        console.log('cartData is: ',cartData);
        if(cartData){
            if(userData && userData.coupon){
                const providedCode = coupon;
                const couponExist = userData.coupon.find(
                    userCoupon => userCoupon.coupon.code === providedCode
                )
                if(couponExist){
                    const currentDate = new Date();
                    const expireDate = couponExist.expireDate;
                    if(currentDate > expireDate){
                        return res.json({status:false,message:'Coupon validity expired.'});
                    }
    
                    if(couponExist.brand || couponExist.category){
                        console.log('hi brand and category section');
                    }else{
                        let offer = parseInt(couponExist.coupon.offer,10);
                        const discountAmount = Math.ceil(offer*total/100);
                        const discountTotal = total - discountAmount;
                        const couponObj = {
                            code: coupon,
                            offer: offer,
                            discountAmount: discountAmount,
                            discountTotal: discountTotal,
                            total: total
                        }
                        req.session.appliedCoupon = couponObj;
                        console.log('coupon saved in session is: ',req.session.appliedCoupon);
                        setTimeout(() => {
                            delete req.session.appliedCoupon; 
                            console.log('deleted applied coupon.');
                        }, 5*60*1000);
                        res.status(200).json({status:true,offer:offer,discountAmount:discountAmount,discountTotal:discountTotal,total:total});
                    }
                }else{
                    return res.json({status:false,message:'Invalid coupon code.'});
                }
            }else{
                return res.json({status:false,message:'Invalid coupon'});
            }
        }
    } catch (error) {
        console.log('error occurred while applying coupon.', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    loadCoupon,
    loadCreateCoupon,
    loadEditCoupon,
    loadUserCoupon,
    createCoupon,
    editCoupon,
    deleteCoupon,
    applyCoupon
}