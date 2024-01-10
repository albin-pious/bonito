const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const { getDb } = require('../config/dbConnect');
const { ObjectId } = require('mongodb');
const otpService = require('../utilities/otpService');
const { paginate } = require('../helpers/pagination');
const { addCouponToUser } = require('../helpers/dynamicCoupon');
const bcrypt = require('bcrypt');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const dotenv = require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

//RAZORPAY INSTANCES.
var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const trendyProducts = async()=>{
  const db = getDb();
  const trend = await db.collection('order').aggregate([
    { $unwind: '$productDetails'},
    {
      $group: {
        _id: '$productDetails.item',
        totalQuantity: { $sum: '$productDetails.quantity'}
      }
    },
    { $sort: { totalQuantity: -1 }},
    { $limit: 8},
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    { $unwind: '$productDetails'},
    {
      $project: {
        _id: '$productDetails._id',
        name: '$productDetails.title',
        totalQuantity: '$totalQuantity',
        price: '$productDetails.price',
        offer: '$productDetails.offer',
        images: '$productDetails.images'
      }
    }
  ]).toArray()

  return trend;
}

const loadHome = async (req, res) => {
  try {
    const db = getDb();
    const userCollection = db.collection('users');
    const productCollection = db.collection('products');
    const catCollection = db.collection('category');
    const gentsCollectionCount = await productCollection.countDocuments({gender:'men'}) || 0;
    const ladiesCollectionCount = await productCollection.countDocuments({gender:'women'}) || 0;
    const catData = await catCollection.find().toArray();
    console.log('cat data is: ',catData);
    const recentProducts = await productCollection.find()
    .sort({ _id: -1 })
    .limit(8)
    .toArray();
    const trends = await trendyProducts();
    console.log('trendy products is: ',trends);
    let userData = null;
    if (req.session.user) {
      const userId = req.session.user._id;
      const objectIdUserId = new ObjectId(userId)
      userData = await userCollection.findOne({ _id: objectIdUserId });
      let cartCount = await getCartCount(objectIdUserId );
      let wishlistCount = await getWishlistCount(objectIdUserId);
      
      res.render('home', { 
        userData: userData,
        recentProducts:recentProducts,
        trendyProducts: trends,
        catData,
        cartCount,
        wishlistCount,
        title:'Bonito | Home Page.',
        gentsCollectionCount,
        ladiesCollectionCount
       });
    }else{
      res.render('home',{
        recentProducts:recentProducts,
        trendyProducts:trends,
        catData,
        title:'Bonito | Home Page.',
        gentsCollectionCount,
        ladiesCollectionCount
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getCartCount = async (userId) => {
  try {
    let count = 0;
    const db = getDb();
    let cartCollection = db.collection('cart');
    const cartData = await cartCollection.findOne({ userId});
    if (cartData) {
      count = cartData.productId.length;
    }
    return count;
  } catch (error) {
    console.error('error when loading counting cart ', error);
    throw error; // Rethrow the error to handle it in the calling code
  }
};

const getWishlistCount = async(userId)=>{
  try {
    let count = 0;
    const db = getDb();
    let wishlistCollection = db.collection('wishlist');
    const wishlistData = await wishlistCollection.findOne({userId});
    if(wishlistData){
      count = wishlistData.products.length;
    }
    return count;
  } catch (error) {
    console.error('error when loading counting wishlist',error);
    throw error;
  }
}

const loadLogin = async (req, res) => {
  try {
    res.render('login',{message:'',title:'Bonito | Login Page.'});
  } catch (error) {
    console.log(error.message);
  }
};

const loadOtpLogin = async(req,res)=>{
  try {
    res.render('otpLogin',{title:'Bonito | OTP Page'})
  } catch (error) {
    console.log(error);
  }
}

const loadRegister = async (req, res) => {
  try {
    res.render('register',{title:'Bonito | User Register Page.'});
  } catch (error) {
    console.log(error);
  }
};

const loadOtp = async(req,res)=>{
  let {name,email,password,mobile} = req.body;
  try {
    const db = getDb();
    const collection = db.collection('users');
    const userWithEmail = await collection.findOne({ email });
    const userWithMobile = await collection.findOne({ mobile });
    if(!userWithEmail){
      if(!userWithMobile){
        if(!req.session.userData || !req.session.userData.generatedOTP){
          let generatedOTP = otpService.generateOTP();
          console.log(generatedOTP);
          req.session.userData = {
            name,
            email,
            password,
            mobile,
            generatedOTP
          }
          console.log('values stored in session is ',req.session.userData);
          name = req.body.name ? req.body.name : req.session.userData.name;
          email = req.body.email ? req.body.email : req.session.userData.email;
          password = req.body.password ? req.body.password : req.session.userData.password;
          mobile = req.body.mobile ? req.body.mobile : req.session.userData.mobile;
          otpService.sendOtp(email,generatedOTP)
          res.render('otpVerify');
          setTimeout(() => {
            req.session.userData.generateOTP = null;
            console.log('deleted value otp from session');
          }, 60*1000);
        }else{
          return res.render('otpVerify',{title:'Bonito | OTP Verify Page.'})
        }
      }else{
        return res.render('register',{message:'email or mobile is already existing.',title:'Bonito | User Register Page.'})
      }
    }else{
      return res.render('register',{message:'email or password is already existing.',title:'Bonito | User Register Page.'})
    }
  } catch (error) {
    console.error('error occured during loading the otp',error.message);
    res.status(500).send('Internal Server Problem in loadOtp.');
  }
}

const resendOtp = async (req, res) => {
  try {
    const userData = req.session.userData;
    console.log('data from resendOtp ',userData);
    if (!userData) {
      return res.render('register', { message: 'Please redirect to the login page.',title:'Bonito | User Register Page.' });
    }

    // Generate a new OTP
    const regeneratedOtp = otpService.generateOTP();
    userData.generatedOTP = regeneratedOtp;

    // Automatically remove generatedOTP after 1 minute
    setTimeout(() => {
      delete userData.generatedOTP;
      console.log('Deleted regenerated OTP.');
    }, 60 * 1000);

    // Resend the OTP
    otpService.sendOtp(userData.email, regeneratedOtp);

    console.log('Regenerated OTP:', regeneratedOtp);
    console.log('User data retrieved from session:', userData);

    return res.render('otpVerify',{ title:'Bonito | OTP Verify Page'});
  } catch (error) {
    console.error('Error during OTP regeneration:', error);
    return res.status(500).send('An error occurred during OTP regeneration.');
  }
};

const verifyOtp = async (req, res) => {
  const { otp } = req.body;
  let userData;
  if(req.session.userData){
    userData = req.session.userData;
  }else{
    return res.render('otpVerify', { message: `Your Data couldn't find try after some time.`,title:'Bonito | OTP Verify Page.' });
  }
  console.log('user data from verify login: ',userData);
  try {
    if (!userData) {
      return res.render('otpVerify', { message: 'Invalid OTP request...',title:'Bonito | OTP Verify Page.' });
    }
    console.log('value of userData.generateOTP',userData.generatedOTP);
    if (otp === userData.generatedOTP) {
      const { name, email, password, mobile } = userData;

      const db = getDb();
      const collection = db.collection('users');
      const couponCollection = db.collection('coupons');
      const couponData = await couponCollection.findOne({apply:'welcome',status:'active'});
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User(name, email, hashedPassword, mobile);

      const result = await collection.insertOne(newUser);
      delete req.session.userData;
      if(couponData && couponData.status==='active'){
        const insertedId = new ObjectId(result.insertedId);
        const coupon = {
          _id: couponData._id,
          name: couponData.couponName,
          code: couponData.couponCode,
          offer: couponData.couponOffer,
          expireDate: couponData.expireDate
        }

        await addCouponToUser(collection,insertedId,coupon);
      }
      res.render('login', { success: 'Registration completed. Please Login',title:'Bonito | Login Page.' });
    } else {
      return res.render('otpVerify', { message: 'Invalid OTP.',title:'Bonito | SMS Verify Page.' });
    }
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).send('An error occurred during registration.');
  }
};

const sendLoginOtp = async(req,res)=>{
  const {mobile} = req.body;
  console.log('number from req.body',mobile);
  try {
    const db = getDb();
    const collection = db.collection('users');
    const user = await collection.findOne({ mobile })
    console.log(user);
    if(user){
      const generatedOTP = otpService.generateOTP();
      console.log('otp for sms is',generatedOTP);
      const completeNumber = '+91'+mobile;
      const {_id,name,email,password,role}=user;
      const smsSend = await otpService.sendOtpSMS(completeNumber,generatedOTP);
      if(smsSend){
        req.session.loginData = {
          _id,
          name,
          email,
          password,
          mobile,
          generatedOTP,
          role
        }
      }else{
        return res.render('otpLogin',{message:`Otp send failed to mobile number please try again later.`,title:'Bonito | Login With OTP Page.'})
      }
      res.render('smsVerify',{title:'Bonito | SMS Verify Page.'});
      }else{
        return res.render('otpLogin',{message:`number doesn't exit`,title:'Bonito | Login With OTP Page'})
      }
      setTimeout(() => {
        req.session.loginData.generateOTP = null;
        console.log('deleted value sms from session');
      }, 60*1000);
    
  } catch (error) {
    console.log('Error occured sendLoginOtp',error);
    res.status(500).json({success:false,message:'An error occurred while processing the request'});
  }
}

const resendLoginOtp = async(req,res)=>{
  try {
    const userData = req.session.loginData;
    console.log('detailes for resend OTP. ',userData);
    if(!userData){
      return res.render('smsVerify',{message:'Please try again late.',title:'Bonito | Login Page.'});
    }
    const generatedOTP = otpService.generateOTP();
    console.log('resended otp is: ',generatedOTP);
    userData.generatedOTP = generatedOTP;
    const completeNumber = '+91'+userData.mobile;
    otpService.sendOtpSMS(completeNumber,generatedOTP);
    res.render('smsVerify');
    setTimeout(() => {
      delete userData.generatedOTP;
      console.log('Deleted regenerated OTP.');
    }, 60 * 1000);
  } catch (error) {
    console.error('error occured While resend Otp.');
  }
}

const verifyLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const db = getDb();
    const collection = db.collection('users');
    const user = await collection.findOne({ email });

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        console.log('user role is', user.role);
        if (user.role === 'User') {
          if(user.blocked){
            return res.render('login',{message:'Your account is blocked.',title:'Bonito | Home Page.'});
          }
          req.session.user = {
            _id:user._id,
            role:user.role
          };
          const db = getDb();
          const productCollection = db.collection('products');
          const catCollection = db.collection('category');
          const gentsCollectionCount = await productCollection.countDocuments({gender:'men'}) || 0;
          const ladiesCollectionCount = await productCollection.countDocuments({gender:'women'}) || 0;
          const userId = req.session.user._id;
          const catData = await catCollection.find().toArray();
          const recentProducts = await productCollection.find()
          .sort({ _id: -1 })
          .limit(8)
          .toArray();
          console.log('session is : ', req.session.user);
          const trends = await trendyProducts();
          console.log('trendy products is: ',trends);
          let cartCount = await getCartCount(userId);
          let wishlistCount = await getWishlistCount(userId);
          console.log('cart count is ',cartCount);
          console.log('wishlist count is: ',wishlistCount);
          return res.render('home', { 
            userData: user,
            recentProducts,
            catData,
            cartCount,
            wishlistCount,
            trendyProducts: trends,
            title:'Bonito | Home Page',
            gentsCollectionCount,
            ladiesCollectionCount
          });
        } else {
          return res.render('login', { message: 'permission denied.',title:'Bonito | Home Page.' });
        }
      } else {
        return res.render('login', { message: 'e-mail or password are incorrect.',title:'Bonito | Home Page.' });
      }
    } else {
      return res.render('login', { message: 'e-mail or password incorrect',title:'Bonito | Home Page' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('An error occurred during login');
  }
};

const verifyLoginWithOtp = async(req,res)=>{
  const {otp}=req.body;
  try {
    const db = getDb();
    console.log('otp from reqBody ',otp);
    const userData = req.session.loginData;
    const storedOTP = userData.generatedOTP;
    console.log('stored otp is: ',storedOTP); 
    console.log('loginData in verify login is ',userData)
    if(!userData){
      return res.render('smsVerify',{message:'Failed to locate user.',title:'Bonito | SMS Verify Page.'})
    }
    console.log('value of userData.generatedOTP is: ',userData.generatedOTP);
    if(otp===storedOTP){
      if(userData.role==='User'){
        if(userData.blocked){
          return res.render('smsVerify',{message:'your account is blocked.',title:'Bonito | SMS Verify Page.'})
        }
        req.session.user = {
          _id:userData._id,
          role:userData.role
        };
        delete req.session.loginData;
        const userId = new ObjectId(req.session.user._id);
        console.log('userId is ',userId);
          const productCollection = db.collection('products');
          const catCollection = db.collection('category');
          console.log('hai 1');
          const catData = await catCollection.find().toArray();
          const recentProducts = await productCollection.find()
          .sort({ _id: -1 })
          .limit(8)
          .toArray();
          console.log('session is : ', req.session.user);
          let cartCount = await getCartCount(userId);
          let wishlistCount = await getWishlistCount(userId);
          let trends = await trendyProducts();
          console.log('hai 2');
          console.log('cart count is ',cartCount);
          console.log('wishlist count is: ',wishlistCount);
          const gentsCollectionCount = await productCollection.countDocuments({gender:'men'}) || 0;
          const ladiesCollectionCount = await productCollection.countDocuments({gender:'women'}) || 0;
          return res.render('home', { 
            userData,
            recentProducts,
            catData,
            cartCount,
            wishlistCount,
            trendyProducts: trends,
            title:'Bonito | Home Page',
            gentsCollectionCount,
            ladiesCollectionCount
          });
      }else{
        return res.render('smsVerify',{message:'not permitted to this section.',title:'Bonito | SMS Verify Page.'})
      }
    }else{
      return res.render('otpVerify',{message:'Invalid OTP',title:'Bonito | OTP Page.'});
    }
  } catch (error) {
    console.error('error occured during verifying sms ',error.message);
    res.status(500).send('Error Occured in verifying OTP.');
  }
}

const loadForgotPassword = async(req,res)=>{
  try {
    res.render('forgotPasswordView');
  } catch (error) {
    console.log('error to load forgot password',error.messagel);
  }
}

const sendForgotOtp = async(req,res)=>{
  try {
    const {email,mobile} = req.body;
    const db = getDb();
    const collection = db.collection('users');
    if(email){
      const user = await collection.findOne({email})
      console.log('user data using email is: ',user);
      if(!user){
        return res.render('forgotPasswordView',{message:`email doesn't exit please register.`,title:'Bonito | Recover Password.'})
      }
      const generatedOTP = otpService.generateOTP();
      console.log('generated otp forgot password: ',generatedOTP);
      const {_id,name,password} = user;
      req.session.emailUserDetailes = {
        _id,
        name,
        password,
        email,
        generatedOTP
      };
      otpService.sendOtp(email,generatedOTP);
      res.render('forgotPasswordEnter',{title:'Bonito | Recover Password.'});
      setTimeout(() => {
        delete req.session.emailUserDetailes.generatedOTP;
        console.log('otp for forgot password is deleted.');
      }, 60*1000);
    } else{
      const user = await collection.findOne({mobile});
      console.log('user data using mobile is: ',user);
      if(!user){
        return res.render('forgotPasswordView',{message:`email doesn't exit please register.`,title:'Bonito | Recover Password.'});
      }
      const generatedOTP = otpService.generateOTP();
      console.log('generatedOTP for forgot password using sms',generatedOTP);
      const {_id,name,password}=user;
      req.session.mobileUserDetailes = {
        _id,
        name,
        password,
        mobile,
        generatedOTP
      }
      const completeNumber = `+91${mobile}`;
    await otpService.sendOtpSMS(completeNumber,generatedOTP);
    res.render('forgotPasswordEnter',{title:'Bonito | Recover Password'});
    setTimeout(() => {
      delete req.session.mobileUserDetailes.generatedOTP;
      console.log('otp for forgot password is deleted.');
    }, 60*1000);
    }
    req.session.userSessionData = req.session.emailUserDetailes?req.session.emailUserDetailes:req.session.mobileUserDetailes;
    console.log('userSessionData is: ',req.session.userSessionData);  
  } catch (error) {
    console.log('error occured while send forgot otp :',error.message);
  }
}

const resendForgotOtp = async(req,res)=>{
  try {
    const userData = req.session.emailUserDetailes?req.session.emailUserDetailes:req.session.mobileUserDetailes;
    console.log('userData from resendforgototp is: ',userData);
    const email = userData && userData.email?userData.email:null;
    const mobile = userData && userData.mobile?userData.mobile:null;
    console.log('userData email is: ',email,'and mobile is: ',mobile);
    if(!userData){
      return res.render('forgotPasswordEnter',{message:'Please try again later.',title:'Bonito | Recover Password.'})
    }
    if(email){
      const generatedOTP = await otpService.generateOTP();
      console.log('regenerated otp is :',generatedOTP);  
      req.session.emailUserDetailes.generatedOTP=generatedOTP;
      await otpService.sendOtp(email,generatedOTP);
      res.render('forgotPasswordEnter',{title:'Bonito | Recover Password.'});
      setTimeout(() => {
        delete req.session.emailUserDetailes.generatedOTP;
        console.log('regenarated otp is removed');
      }, 60*1000);
    }else{
      const generatedOTP = await otpService.generateOTP();
      console.log('generated sms otp is:',generatedOTP);
      req.session.mobileUserDetailes.generatedOTP=generatedOTP;
      const completeNumber = `+91${mobile}`;
      otpService.sendOtpSMS(completeNumber,generatedOTP);
      res.render('forgotPasswordEnter',{title:'Bonito | Recover Password.'});
      setTimeout(() => {
        delete req.session.mobileUserDetailes.generateOTP;
        console.log('regenerated sms is removed.');
      }, 60*1000);
    }
  } catch (error) {
    console.log('error occured while try to resend forgototp',error.message);
  }
}

const verifyForgotOtp = async (req,res)=>{
  try {
    const {otp} = req.body;
    const db = getDb();
    const collection = db.collection('users');
    const otpViaEMail = req.session.emailUserDetailes?req.session.emailUserDetailes.email:null;
    const otpViaMobile = req.session.mobileUserDetailes?req.session.mobileUserDetailes.mobile:null;
    const sesseionData = req.session.emailUserDetailes?req.session.emailUserDetailes:req.session.mobileUserDetailes;
    console.log('via email',otpViaEMail,'via mobile',otpViaMobile);
    let user;
    if(otpViaEMail){
      const email = otpViaEMail;
      user = await collection.findOne({email})
      if(!user){
        return res.render('forgotPasswordEnter',{message:'Please type registered email',title:'Bonito | Recover Password.'})
      }
    }else{
      const mobile = otpViaMobile;
      user = await collection.findOne({mobile});
      if(!user){
        return res.render('forgotPasswordEnter',{message:'Please type registered mobile number',title:'Bonito | Recover Password.'});
      }
    }
    if(otp===sesseionData.generatedOTP){
      res.render('resetPassword',{title:'Bonito | Recover Password'});
    }else{
      return res.render('forgotPasswordEnter',{message:'Invalid OTP.',title:'Bonito | OTP Page.'})
    }
  } catch (error) {
    console.log('error occured while verifying otp. ',error.message);
  }
}

const resetPassword = async (req, res) => {
  const { password, confirmPassword } = req.body;
  console.log('Password:', password);
  console.log('Confirm Password:', confirmPassword);

  try {
    const db = getDb();
    const collection = db.collection('users');
    if (password !== confirmPassword) {
      return res.render('resetPassword', { message: 'Confirm password is incorrect.',title:'Bonito | Recover Password.' });
    }
    const sessionData = req.session.emailUserDetailes || req.session.mobileUserDetailes;
    console.log('Session Data:', sessionData);
    let findUser;
    if (sessionData) {
      findUser = sessionData.email || sessionData.mobile;
      console.log('Find User:', findUser);
    }
    let user;
    if (findUser) {
      user = await collection.findOne({ email: findUser }) || await collection.findOne({ mobile: findUser });
    }
    if(user){
      const securePassword = await bcrypt.hash(password,10);
      await collection.updateOne(
        { $or:[{email:findUser},{mobile:findUser}]},
        { $set: {password:securePassword}}
      );
      res.render('login',{message:'Password reset successfull, please login.',title:'Bonito | Login Page'})
    }
    res.render('resetPassword',{title:'Bonito | Recover Password.'})

  } catch (error) {
    console.log('Error occurred while resetting password:', error);
  }
}

const loadShop = async(req,res)=>{
  const pageNum = parseInt(req.query.page,10) || 1;
  const perPage = 9;
  const gen = req.params.gen;
  try {
    const db = getDb();
    const productCollection = db.collection('products');
    const brandCollection = db.collection('brand');
    const userCollection = db.collection('users');
    const catCollection = db.collection('category');
    const catData = await catCollection.find().toArray();
    const brandData = await brandCollection.find().sort({ fieldName: 1 }).limit(10).toArray();
    let { result: productData, currentPage, totalPages, totalcount } = await paginate( productCollection, pageNum, perPage );
    if(req.session.user){
      let user = req.session.user._id;
      let objectIdUserId = new ObjectId(user);
      const userData = await userCollection.findOne({_id: new ObjectId(user)});
      const cartCount = await getCartCount(objectIdUserId)
      const wishlistCount = await getWishlistCount(objectIdUserId);
      res.render('shop',{
        productData,
        currentPage,
        totalDocument: totalcount,
        pages: totalPages,
        brandData,
        userData,
        cartCount,
        catData,
        wishlistCount,
        title:'Bonito | Shop-Product Page.'
      });
    }else{
      res.render('shop',{
        productData,
        currentPage,
        totalDocument: totalcount,
        pages: totalPages,
        brandData,
        title:'Bonito | Shop Page.'
      });
    }
  } catch (error) {
    console.error('error occured while loading page.',error);
  }
}

const loadProductDetailes = async(req,res)=>{
  const {id:productId} = req.params;
  try {
    const user = req.session.user._id;
    const db = getDb();
    const productCollection = db.collection('products');
    const brandCollection = db.collection('brand');
    const userCollection = db.collection('users');
    const orderCollection = db.collection('order')
    const objectIdProductId = new ObjectId(productId);
    const productData = await productCollection.findOne({_id:objectIdProductId});
    const category = productData.category;
    const brand = productData.brand;
    const brandData = await brandCollection.findOne({ _id: new ObjectId(brand)});
    const userData = await userCollection.findOne({ _id: new ObjectId(user) });
    const orderData = await orderCollection.find({userId:user,'productDetails.item': objectIdProductId}).toArray();
    const brandName = brandData.brandName;
    const reviewData = await userCollection
    .find(
      {
        'reviews': {
          $elemMatch: {
            'productId': productId 
          }
        }
      }
    ).toArray();
    console.log('orderData ',orderData);   
    const averageRating = calculateAverageRating(reviewData[0]?.reviews);
    console.log('averageRating is ',averageRating);
    let isReviewAdded = reviewData && reviewData.length > 0 && reviewData[0].reviews.some(review => review.productId === productId);
    console.log(`is review added: ${isReviewAdded} and order data is ${orderData}`);
    const productSuggestion = await fetchRandomProducts(category,productId,5);
    res.render('product',{
      data: productData,
      suggestion: productSuggestion, 
      brandName,
      orderData,
      userData,
      reviewData,
      isReviewAdded,
      averageRating,
      title:'Bonito | Shop-Product Page'
    });
  } catch (error) {
    console.log('error occured while creating product detailes. ',error);
  }
}

const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) {
    return 0; // Default to 0 if there are no reviews
  }

  const totalRating = reviews.reduce((sum, review) => {
    const rating = parseInt(review.rating);
    console.log(`Review ID: ${review._id}, Rating: ${rating}`);
    return isNaN(rating) ? sum : sum + rating;
  }, 0);

  const averageRating = totalRating / reviews.length;
  console.log('Total Rating:', totalRating);
  console.log('Average Rating:', averageRating);

  return averageRating;
};

const loadCheckout = async(req,res)=>{
  try {
    const user = req.session.user; 
    console.log(user);
    const userId = user._id;
    const db = getDb();
    const productCollection = db.collection('products');
    const cartCollection = db.collection('cart');
    const userCollection = db.collection('users');
    const objectIdUserId = new ObjectId(userId);
    const userData = await userCollection.findOne({_id:objectIdUserId});
    const couponData = req.session.appliedCoupon;
    let totalValue,discountAmount,discountTotal,total,couponCode;
    if(couponData){
      totalValue = couponData.total;
      discountAmount = couponData.discountAmount;
      discountTotal = couponData.discountTotal;
      total = couponData.total;
      couponCode = couponData.code;
    }else{
      totalValue = await calculateCartTotal(cartCollection,userId);
    }
    const cartId = await cartCollection.findOne({userId: objectIdUserId},{$project:{_id:0}});
    const cartData = await cartCollection.aggregate([
      {
        $match:{userId:objectIdUserId}
      },
      {
        $unwind:'$productId'
      },
      {
        $project:{
          item:'$productId.item',
          quantity:'$productId.quantity'
        }
      },
      {
        $lookup:{
          from:'products',
          localField:'item',
          foreignField:'_id',
          as:'product'
        }
      },
      {
        $project:{
          item:1,
          quantity:1,
          product:{$arrayElemAt:['$product',0]}
        }
      }
     ]).toArray();
    res.render('checkout',{
      userData,
      totalValue,
      productData:cartData,
      cartId,
      couponCode,
      total,
      discountTotal,
      discountAmount,
      title:'Bonito | Checkout Page.'
    });
  } catch (error) {
    console.log('error occured loading checkout ',error);
  }
}

const fetchRandomProducts = async (categoryId, currentProductId, limit) => {
  try {
    const db = getDb();
    const productCollection = db.collection('products');
    console.log('categoryid is ',categoryId);
    // Count the total products for the given category
    const totalProducts = await productCollection.countDocuments({ category: categoryId });
    console.log('totalproducts',totalProducts);
    // Ensure the random starting index does not exceed the available products
    const randomStartIndex = Math.max(0, totalProducts - limit);
   
    const categoryProductRandom = await productCollection
      .find({ category: categoryId, _id: { $ne: new ObjectId(currentProductId) } })
      .skip(randomStartIndex)
      .limit(limit)
      .toArray();
    console.log('category product random ',categoryProductRandom);  
    return categoryProductRandom;
  } catch (error) {
    console.log('error occurred while fetching category products:', error);
    return [];
  }
}

const setAddress = async (req, res) => {
  try {
    const {
      fname,
      lname,
      email,
      mobile,
      address1,
      address2,
      country,
      city,
      state,
      zipcode
    } = req.body;

    const db = getDb();
    const userCollection = db.collection('users');
    const user = req.session.user;
    const userId = user._id
    const objectIdUserId = new ObjectId(userId);
    const userData = await userCollection.findOne({ _id: objectIdUserId });

    if (!userData) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Update the single address object
    userData.addresses = {
      firstName: fname,
      lastName: lname,
      email,
      mobile,
      address1,
      address2,
      country,
      city,
      state,
      zipcode
    };

    const result = await userCollection.updateOne(
      { _id: objectIdUserId },
      { $set: { addresses: userData.addresses } }
    );

    if (result.modifiedCount === 1) {
      return res.redirect('/checkout')
    } else {
      return res.status(500).json({ error: 'Failed to update user.' });
    }
  } catch (error) {
    console.error('Error occurred while updating address:', error);
    return res.status(500).json({ error: 'Server error.' });
  }
};

const editAddress = async (req, res) => {
  try {
    let {
      fname,
      lname,
      email,
      mobile,
      address1,
      address2,
      country,
      city,
      state,
      zipcode,
    } = req.body;

    const db = getDb();
    const userCollection = db.collection('users');
    const user = req.session.user;
    const userId = user._id;
    country = country || 'India';
    const objectIdUserId = new ObjectId(userId);
    const userData = await userCollection.findOne({ _id: objectIdUserId });

    if (!userData) {
      return res.json({ error: 'User not found.' });
    }

    // Check if the provided city and state match the address in the "addresses" object
    if (userData.addresses.city === city && userData.addresses.state === state) {
      // Update the address properties
      userData.addresses.firstName = fname;
      userData.addresses.lastName = lname;
      userData.addresses.email = email;
      userData.addresses.mobile = mobile;
      userData.addresses.address1 = address1;
      userData.addresses.address2 = address2;
      userData.addresses.country = country;
      userData.addresses.zipcode = zipcode;

      const result = await userCollection.updateOne(
        { _id: objectIdUserId },
        { $set: { addresses: userData.addresses } }
      );

      if (result.modifiedCount === 1) {
        return res.redirect('/profile');
      } else {
        return res.status(500).json({ error: 'Failed to update user.' });
      }
    } else {
      return res.status(404).json({ error: 'Address not found.' });
    }
  } catch (error) {
    console.error('Error occurred while updating address:', error);
    return res.status(500).json({ error: 'Server error.' });
  }
};

const calculateCartTotal = async(cartCollection, userId)=> {
  const objectIdUserId = new ObjectId(userId);

  const cartData = await cartCollection.aggregate([
    {
      $match: { userId: objectIdUserId }
    },
    {
      $unwind: '$productId'
    },
    {
      $project: {
        item: '$productId.item',
        quantity: '$productId.quantity'
      }
    },
    {
      $lookup: {
        from: 'products',
        localField: 'item',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $project: {
        item: 1,
        quantity: 1,
        product: { $arrayElemAt: ['$product', 0] }
      }
    },
    {
      $addFields: {
        numericPrice: { $toDouble: '$product.price'}
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: {
          $sum: { $multiply: ['$quantity', '$numericPrice'] }
        }
      }
    }
  ]).toArray();

  // The result will be an array with a single document containing the total amount.
  const totalAmount = cartData[0] ? cartData[0].totalAmount : 0;

  return totalAmount;
}

const loadCart = async (req, res) => {
  try {
    const user = req.session.user;
    const userId = user._id;
    const db = getDb();
    const catCollection = await db.collection('category');
    const userCollection = await db.collection('users');
    const cartCollection = await db.collection('cart');
    const objectIdUserId = new ObjectId(userId);
    const cartData = await cartCollection.aggregate([
    {
      $match:{userId:objectIdUserId}
    },
    {
      $unwind:'$productId'
    },
    {
      $project:{
        item:'$productId.item',
        quantity:'$productId.quantity',
        selectedSize:'$productId.selectedSize'
      }
    },
    {
      $lookup:{
        from:'products',
        localField:'item',
        foreignField:'_id',
        as:'product'
      }
    },
    {
      $project:{
        item:1, 
        quantity:1,
        selectedSize:1,
        product:{$arrayElemAt:['$product',0]}
      } 
    }
   ]).toArray();
   
   const productsOutOfStock = cartData.filter(product => {
    const selectedSizeUnit = product.sizeUnits && product.sizeUnits.length > 0
        ? product.sizeUnits.find(sizeUnit => sizeUnit.size === product.selectedSize)
        : null;
    return !selectedSizeUnit || selectedSizeUnit.stock <= 0;
});
  
// Assuming productData is an array containing product information
let stockChecker = [];

cartData.forEach(product => {
    // Check if sizeUnits is defined and is an object
    if (product.product.sizeUnits && typeof product.product.sizeUnits === 'object') {
        Object.keys(product.product.sizeUnits).forEach(function (size) {
            // Use the correct case for 'sizeUnits'
            if (size === product.selectedSize && product.product.sizeUnits[size] < product.quantity) {
                // Add item to stockChecker array
                stockChecker.push({
                    size: size,
                    productQuantity: product.quantity,
                    availableStock: product.product.sizeUnits[size]
                });
            }
        });
    } else {
        console.error('Size units are not defined or not an object for product:', product);
    }
});
  
   let totalValue = await calculateCartTotal(cartCollection,userId);
    const catData = await catCollection.find().toArray();
    const userData = await userCollection.findOne({ _id: objectIdUserId });
    // console.log('cart data is: ',cartData);

    res.render('cart', {
      catData,
      userData,
      productData: cartData,
      totalValue,
      quantityChecker: stockChecker,
      title:'Bonito | Cart Page.'
    });
  } catch (error) {
    console.error('Error occurred while loading cart page:', error);
  } 
};

const addProductToCart = async (req, res) => {
  const { id } = req.params;
  const selectedSize = req.query.size; 
  try {
      const db = getDb();
      const cartCollection = db.collection('cart');
      const user = req.session.user;
      const userId = user._id;
      const objectIdUserId = new ObjectId(userId);
      const objectIdProductId = new ObjectId(id);
      let proObj = {
        item: objectIdProductId,
        quantity: 1,
        selectedSize: selectedSize
      }
      // Check if the product already exists in the cart
      const existingCartItem = await cartCollection.findOne({
          userId: objectIdUserId,
          'productId.item': objectIdProductId,
          'productId.selectedSize': selectedSize
      });

      if (existingCartItem) {
        // Case 1: Product already exists in the cart, increment the quantity
        
        const existingQuantity = existingCartItem.productId && existingCartItem.productId[0] ? existingCartItem.productId[0].quantity : 0;
        if (existingQuantity >= 3){
          return res.json({ status:false,message:"Quantity limit reached."});
        }
        const result = await cartCollection.updateOne(
          {
              userId: objectIdUserId,
              'productId.item': objectIdProductId,
              'productId.selectedSize': selectedSize
          },
          {
              $inc: { 'productId.$.quantity': 1 }
          }
        );

        if (result.modifiedCount === 1) {
            res.json({ status: true });
        } else {
            res.json({ status: false });
        }
      } else {
          // Case 2: User has a cart, add the product to the existing cart
          const userCart = await cartCollection.findOne({ userId: objectIdUserId });

          if (userCart) {
              const result = await cartCollection.updateOne(
                  {
                      userId: objectIdUserId
                  },
                  {
                      $push: { productId: proObj }
                  }
              );

              if (result.modifiedCount === 1) {
                  res.json({ status: true });
              } else {
                  res.json({ status: false });
              }
          } else {
              // Case 3: User doesn't have a cart, create a new cart and add the product
              const newCart = new Cart(objectIdUserId, [proObj]);
              const result = await newCart.save();
              res.json({ status: true });
          }
      }
  } catch (error) {
      console.log('Error occurred while adding the product to the cart: ', error);
  }
}

const changeQuantity = async (req, res) => {
  let { user, cart, product, count, available, currentQuantity, selectedSize } = req.body;

  try {
    count = parseInt(count);
    const db = getDb();
    const cartCollection = db.collection('cart');
    const cartData = await cartCollection.findOne({ 
      userId: new ObjectId(user),
      'productId': {
        $elemMatch: {
          'item': new ObjectId(product),
          'selectedSize': selectedSize
        }
      }
    });

    if (cartData) {
      const cartItem = cartData.productId.find(data => data.item.equals(new ObjectId(product)) && data.selectedSize === selectedSize );
      console.log('cartItem',cartItem);
      if (cartItem) {
        let newQuantity;

        if (count === 1) {
          console.log('cart quantity',cartItem.quantity);
          newQuantity = cartItem.quantity + 1;
          console.log('new quantity: ',newQuantity);
          const maxQuantity = available;
          console.log('max quantity: ',maxQuantity);
          const maxLimit = maxQuantity;
          console.log('max limit: ',maxLimit);
          if (newQuantity > maxLimit) {
            newQuantity = maxLimit;
          }

          if (newQuantity > maxQuantity) {
            return res.json({ success: 'Selected quantity exceeds the Stock.' });
          }
        } else if (count === -1) {
          newQuantity = cartItem.quantity - 1;

          if (newQuantity < 1) {
            newQuantity = 1;
          }
        }

        await cartCollection.updateOne({
          userId: new ObjectId(user),
          'productId.item': new ObjectId(product),
          'productId.selectedSize': selectedSize
        }, {
          $inc: { 'productId.$.quantity': count }
        });

         res.json({ message: 'Quantity Updated.' });
      }
    }

    // console.log('cartData is: ',cartData)
    const totalValue = await calculateCartTotal(cartCollection,user);
    console.log('availabe: ',available, "current quantity: ",currentQuantity);
    let current = parseInt(currentQuantity);
    console.log('totalValue is ',totalValue);
    let stock = parseInt(available)
    // if(current > stock && count == 1){
    //   return res.json({status:false,message:'selected quantity is exceeds available quantity.'});
    // }
    // const result = await cartCollection.updateOne(
    //   {
    //     _id: new ObjectId(cart),
    //     "productId.item": new ObjectId(product),
    //     "productId.selectedSize": selectedSize
    //   },
    //   {
    //     $inc: { "productId.$.quantity": count }
    //   }
    // );    
    // if(result.modifiedCount === 1){
    //   res.json({status:true,totalValue:totalValue});
    // }else{
    //   res.json({status:false});
    // }
    // console.log('result is ',result);
  } catch (error) {
    console.log('error occure while changing quantity. ',error);
  }
}

const removeCartItem = async (req, res) => {
  let { cartId, productId } = req.body;
  try {
      const db = getDb();
      const cartCollection = db.collection('cart');
      const result = await cartCollection.updateOne(
          { _id: new ObjectId(cartId) },
          {
              $pull: { productId: { item: new ObjectId(productId) } }
          }
      );
      if (result.modifiedCount === 1) {
          res.json({ status: true });
          console.log('remove sucess');
      } else {
          res.json({ status: false });
      }
  } catch (error) {
      console.log('error occurred while removing cart.', error);
  }
}

const placeOrder = async (req, res) => {
  let { paymentMethod, userId, cartId } = req.body;
  try {
    const db = getDb();
    const orderCollection = db.collection('order');
    const cartCollection = db.collection('cart');
    const userCollection = db.collection('users');
    const productCollection = db.collection('products');

    const ObjectIdUserId = new ObjectId(userId);

    // Fetch product details from the cart and calculate the total price
    let productDetails = await getCartProducts(userId);
    let totalPrice = req.session.appliedCoupon ? req.session.appliedCoupon.discountTotal : await calculateCartTotal(cartCollection, userId);

    // Determine the order status based on the payment method
    let status = paymentMethod === 'cod' ? 'Placed' : 'Pending';

    // Fetch user data to get the address
    const userData = await userCollection.findOne({ _id: new ObjectId(userId) });
    const address = userData.addresses || null;
    const appliedCoupon = req.session.appliedCoupon || null;
    // Create a new order instance
    const newOrder = new Order(
      ObjectIdUserId,
      productDetails,
      totalPrice,
      status,
      address,
      paymentMethod,
      appliedCoupon
    );

    // Insert the new order into the database
    const result = await orderCollection.insertOne(newOrder);
    console.log('result.insertedId ', result.insertedId);
    await userCollection.updateOne({_id: ObjectIdUserId})
    if (result.insertedId) {
      // Update product quantities, delete the cart, and handle payment
      await updateQuantity(orderCollection, productCollection, result.insertedId);
      await cartCollection.deleteOne({ userId: new ObjectId(userId) });

      // Handle payment methods
      if (paymentMethod === 'cod') {
        const couponCollection = db.collection('coupons');
        const couponData = await couponCollection.findOne({ apply: 'purchase', minAmount: { $gte: totalPrice } });

        if (couponData && couponData.status === 'active') {
          const coupon = {
            _id: couponData._id,
            name: couponData.couponName,
            code: couponData.couponCode,
            offer: couponData.couponOffer,
            expireDate: couponData.expireDate
          };

          console.log('hai before addCouponToUser');
          await addCouponToUser(userCollection, ObjectIdUserId, coupon);
          console.log('hai');
          res.json({ codSuccess: true, orderId: result.insertedId });
        } else if (paymentMethod === 'online') {
          const rpayOrder = await generateRP(result.insertedId, totalPrice);
          console.log('order ', rpayOrder);
          res.json({ order: rpayOrder });
        }
      } else if(paymentMethod === 'online'){
        const rpayOrder = await generateRP(result.insertedId, totalPrice);
        console.log('order',rpayOrder);
        res.json({ order: rpayOrder});
      }
    } else {
      console.log('Error: No inserted ID found');
    }
  } catch (error) {
    console.log('Error occurred while placing an order. ', error);
    // Send an appropriate response to the client, indicating the error
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function updateQuantity(orderCollection, productCollection, orderId) {
  const db = getDb();
  const orderData = await orderCollection.findOne({ _id: orderId });

  for (let productDetails of orderData.productDetails) {
    const productId = productDetails.item;
    const selectedSize = productDetails.selectedSize;
    const quantityToDecrease = productDetails.quantity;

    try {
      await productCollection.updateOne(
        { _id: productId, [`sizeUnits.${selectedSize}`]: { $gte: quantityToDecrease } },
        { $inc: { [`sizeUnits.${selectedSize}`]: -quantityToDecrease, stock: -quantityToDecrease } }
      );
    } catch (error) {
      console.error('Error updating product quantities:', error);
    }
  }
}

const getCartProducts = async(userId)=>{
  try {
    const db = getDb();
    const cartCollection = db.collection('cart')
    let cart = await cartCollection.findOne({userId: new ObjectId(userId)});
    let product;
    return product = cart.productId;
  } catch (error) {
    console.error('error occured when fetching detailes.',error);
  }
}

const getOrderDetailes = async (userId) => {
  console.log('hai from getOrderDetailes.');
  const db = getDb();
  const orderCollection = db.collection('order');
  console.log('orderId is ',userId);
  const aggregationPipeline = [
    {
      $match: {
        userId: new ObjectId(userId)
      }
    },
    {
      $sort: {
        orderDate: -1 
      }
    },
    {
      $limit: 1 
    }
  ];

  const orderData = await orderCollection.aggregate(aggregationPipeline).toArray();
  return orderData;
};

const generateRP = async (orderId, totalPrice) => {
  try {
    const order = await instance.orders.create({
      amount: totalPrice*100,
      currency: 'INR',
      receipt: orderId,
      notes: {
        key1: 'value3',
        key2: 'value2',
      },
    });
    console.log('hi 2');
    console.log('order: ', order);
    return order;
  } catch (error) {
    console.error('Error occurred while generating Razorpay order:', error);
    throw error; // You may choose to rethrow the error for higher-level handling
  }
}

const verifyRPPayment = async(req,res)=>{
  try {
    const payment = req.body.payment;
    const order = req.body.order;
    console.log('body is: ',req.body);
    const str = `${order.id}|${payment.razorpay_payment_id}`;
    let hmac = crypto.createHmac('sha256',process.env.RAZORPAY_KEY_SECRET);
    hmac.update(str);
    const genrated_signature = hmac.digest('hex');
    if(genrated_signature === payment.razorpay_signature){
      await changePaymentStatus(order.receipt);
      res.json({status:true})
    }else{
      res.json({Status:false})
    }
  } catch (error) {
    console.error('error occured while verifying rp',error);
  }
}

const changePaymentStatus = async (orderId)=>{
  try {
    const db = getDb();
    const collection = db.collection('order');
    const orderData = await collection.findOne({_id: new ObjectId(orderId)});
    const result = await collection.updateOne({_id: new ObjectId(orderId)},
    {
      $set:{status:'Placed'}
    })
    const couponCollection = db.collection('coupons');
    const userCollection = db.collection('users');
    const user = orderData.userId;
    const couponData = await couponCollection.findOne({ apply: 'purchase', minAmount: { $gte: orderData.totalPrice}})

    if(couponData && couponData.status === 'active'){
      const coupon = {
        _id: couponData._id,
        name: couponData.couponName,
        code: couponData.couponCode,
        offer: couponData.couponOffer,
        expireDate: couponData.expireDate
      };
      console.log('hai before addCouponToRPUser.')
      await addCouponToUser( userCollection, user, coupon );
    }
  } catch (error) {
    console.log('error occured while changing password. ',error);
  }
}

const successPage = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const orderData = await getOrderDetailes(userId);
    console.log('order data is ', orderData);
    res.render('orderSuccess',{orderData:orderData,title:'Bonito | Order Success'});
  } catch (error) {
    console.error('Error occurred while redirecting success page.', error);
  }
};

const getUserOders = async(orderId)=>{
  try {
    const db = getDb();
    const orderCollection = db.collection('order');
    const aggregationPipeline = [
      {
        $match: {
          _id: new ObjectId(orderId)
        }
      },
      {
        $unwind: '$productDetails'
      },
      {
        $project: {
          item:'$productDetails.item',
          quantity:'$productDetails.quantity'
        }
      },{
        $lookup: {
          from: 'products',
          localField:'item',
          foreignField:'_id',
          as:'product'
        }
      },
      {
        $project:{
          item:1,
          quantity:1,
          product:{$arrayElemAt:['$product',0]}
        }
      }
      
    ];
    const orderData = await orderCollection.aggregate(aggregationPipeline).toArray();
    return orderData;
  } catch (error) {
    console.error('error occured while getting orders. ',error);
  }
}

const loadOrderView = async (req, res) => {
  const userId = req.session.user._id;
  let pageNum = parseInt(req.query.page, 10) || 1;
  const perPage = 7;

  try {
    const db = getDb();
    const orderCollection = db.collection('order');

    // Count the total number of documents for pagination
    const totalCount = await orderCollection.countDocuments({ userId: new ObjectId(userId) });
    console.log('total count is: ',totalCount);

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalCount / perPage);

    // Ensure the pageNum is within valid range
    if (pageNum < 1) {
      pageNum = 1;
    } else if (pageNum > totalPages) {
      pageNum = totalPages;
    }

    // Calculate the skip value to fetch the correct page of data
    const skip = Math.max(0,(pageNum - 1) * perPage);

    // Retrieve the data for the current page
    const orderData = await orderCollection
      .find({ userId: new ObjectId(userId) })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(perPage)
      .toArray();
      console.log('order data is: ',orderData);

    res.render('orderView', { 
      orderData, 
      currentPage: pageNum, 
      pages:totalPages, 
      totalDocument:totalCount ,
      title:'Bonito | My Orders'
    });
  } catch (error) {
    console.log('Error occurred while loading order view. ', error);
  }
};

const loadProductFromOrder = async(req,res)=>{
  const orderId = req.params.id;
  try {
    const products = await getUserOders(orderId);
    res.render('orderedProducts',{products,title:'Bonito | My Orders-Product.'});
  } catch (error) {
    console.error('error occured while loading product from order: ',error);
  }
}

const loadShopMenorWomen = async (req, res) => {
  const gen = req.params.gen;
  const pageNum = parseInt(req.query.page, 10) || 1;
  const perPage = 9; // Set your desired items per page here

  try {
    const db = getDb();
    const productCollection = db.collection('products');
    const brandCollection = db.collection('brand');
    // Count the total number of documents matching the gender using the count method
    const totalcount = await productCollection.countDocuments({ gender: gen });
    const brandData = await brandCollection.find().sort({ fieldName: 1 }).limit(10).toArray();
    // Fetch the product data with pagination
    const { result: productData, currentPage, totalPages } = await paginate(productCollection, pageNum, perPage,{ gender:gen });
    const productDataArray = productData
    res.render('shop', {
      productData: productDataArray,
      currentPage,
      totalDocument: totalcount,
      pages: totalPages,
      title:'Bonito | Shop Page',
      brandData
    });
  } catch (error) {
    console.error('Error occurred while loading shop based on gender. ', error);
  }
}

const loadShopBasedCategory = async(req,res)=>{
  const catId = req.params.id;
  const pageNum = parseInt(req.query.page,10) || 1;
  const perPage = 9;
  try {
    console.log('hai');
    const db = getDb();
    const productCollection = db.collection('products');
    const totalcount = await productCollection.countDocuments({category:catId});
    const { result: productData,currentPage,totalPages } = await paginate(productCollection,pageNum,perPage,{category:catId});
    res.render('shop',{
      productData,
      currentPage,
      totalDocument:totalcount,
      pages:totalPages,
      title:'Bonito | Shop-Product Page.'
    })
  } catch (error) {
    console.log('error occured while loading category. ',error);
  }
}

const setLowerBound = async(prices) => {
  if (prices.includes(1)) return 0;
  if (prices.includes(2)) return 300;
  if (prices.includes(3)) return 500;
  if (prices.includes(4)) return 1000;
  if (prices.includes(5)) return 1500;
  return 0;
}

const setUpperBound = async(prices) => {
  if (prices.includes(1)) return 300;
  if (prices.includes(2)) return 500;
  if (prices.includes(3)) return 1000;
  if (prices.includes(4)) return 1500;
  if (prices.includes(5)) return Infinity;
  return Infinity;
}

const shopFilter = async(req, res) => {
  const { prices, brands, sizes } = req.body;
  const pageNum = parseInt(req.query.page,10) || 1;
  const perPage = 9;
  try {
    const db = getDb();
    const productCollection = db.collection('products');
    const brandCollection = db.collection('brand');
    const userCollection = db.collection('users');
    const catCollection = db.collection('category');
    const catData = await catCollection.find().toArray();
    const brandData = await brandCollection.find().sort({ fieldName: 1 }).limit(10).toArray();
      
    console.log(req.body);
    let numericPrices = prices && prices.length > 0 ? prices.map(Number) : [];

    // Build individual size conditions
    const sizeFilter = Array.isArray(sizes) ? sizes.map((size) => ({
      [`sizeUnits.${size}`]: { $gte: 1 }
    })) : [];  
      
    const combinedSizeFilter = sizeFilter.length > 0 ? { $or: sizeFilter } : {};
    const query = {
      $and: [
        combinedSizeFilter,
        {
          price: {
            $gte: await setLowerBound(numericPrices),
            $lte: await setUpperBound(numericPrices)
          }
        },
        brands && brands.length > 0 ? { brand: { $in: brands } } : {},
      ]
    };
    const { result: filteredProducts,currentPage, totalPages, totalcount } = await paginate(productCollection, pageNum, perPage, query);
    console.log('MongoDB Query:', JSON.stringify(query, null, 2));
    res.json({
      success: true,
      productData:filteredProducts,
      currentPage,
      totalDocument: totalcount,
      pages: totalPages,
    });
       
    } catch (error) {
      console.error('error occurred while loading filter data', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

const shopSort = async (req, res) => {
  const { forSort } = req.body;
  const pageNum = parseInt(req.query.page,10) || 1;
  const perPage = 9;   
  try {
    const db = getDb();
    const productCollection = db.collection('products');
    let query;
    
    if(forSort === 'latest'){
      query = { _id: -1 }
    }else if(forSort === 'lowToHigh'){
      query = { price: 1 }
    }else if(forSort === 'highToLow'){
      query = { price: -1 }
    }
    let sortedData = await productCollection.find().sort(query).toArray();
    const currentPage = Math.max(1, parseInt(pageNum, 10) || 1);
    const totalcount = sortedData.length;
    const totalPages = Math.ceil( totalcount / perPage );
    const skipValue = ( currentPage - 1 ) * perPage;
    sortedData = await productCollection.find().sort(query).skip(skipValue).limit(perPage).toArray();
    console.log('Sorted data is: ',sortedData,currentPage,totalcount,totalPages);
    
    res.json({
      success: true,
      productData: sortedData,
      currentPage,
      totalDocument: totalcount,
      pages: totalPages,
    })
  } catch (error) {
    console.error('Error in shopSort:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};  

const loadWishlist = async (req, res) => {
  try {
    const user = req.session.user;
    const userId = user._id;
    const db = getDb();
    const wishlistCollection = await db.collection('wishlist');
    const objectIdUserId = new ObjectId(userId);

    const wishlistData = await wishlistCollection.aggregate([
      {
        $match: { userId: objectIdUserId }
      },
      {
        $unwind: "$products"
      },
      {
        $lookup: {
          from: 'products',
          localField: 'products',
          foreignField: '_id',
          as: 'wishlistProducts'
        }
      },
      {
        $group: {
          _id: '$_id',
          userId: { $first: '$userId' },
          products: { $push: '$products' },
          wishlistProducts: { $push: { $arrayElemAt: ['$wishlistProducts', 0] } }
        }
      }
    ]).toArray();
 
    res.render('wishlist', { wishlistData, title:'Bonito | Wishlist Page' });
  } catch (error) {
    console.error('error occurred while loading wishlist ', error);
    res.status(500).send('Error loading wishlist');
  }
}

const addProductToWishlist = async (req,res)=>{
  try {
    const { id } = req.params;
    const db = getDb();
    const wishlistCollection = db.collection('wishlist');
    const user = req.session.user;
    const userId = user._id;
    const objectIdUserId = new ObjectId(userId);
    const objectIdProductId = new ObjectId(id);

    const wishlist = await wishlistCollection.findOne({
      userId: objectIdUserId,
      products: objectIdProductId
    })

    if(wishlist){
      return res.status(200).json({successExist:true, message:"Product  already added to the wishlist"});
    }

     const updateResult = await wishlistCollection.updateOne(
      { userId: objectIdUserId },
      { $addToSet: { products: objectIdProductId } },
      { upsert: true }
    );

    if (updateResult.modifiedCount === 1 || updateResult.upsertedCount === 1) {
      res.status(200).json({success:true, message: 'Product added to wishlist' });
    } else {
      res.status(500).json({ message: 'Failed to add product to wishlist' });
    }
  } catch (error) {
    console.error('error occured while adding product to wishlist. ',error);
  }
}

const removeSavedItem = async (req, res) => {
  const { wishlistId, productId } = req.body;

  try {
    const db = getDb();
    const wishlistCollection = db.collection('wishlist');

    const result = await wishlistCollection.updateOne(
      { _id: new ObjectId(wishlistId) },
      {
        $pull: { products: new ObjectId(productId) } 
      }
    );

    if (result.modifiedCount === 1) {
      res.json({ status: true });
      console.log('Removal success');
    } else {
      res.json({ status: false });
      console.log('Document not found or not removed');
    }
  } catch (error) {
    console.error('Error occurred while removing saved product: ', error);
    res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
};

const loadUserAccount = async (req,res)=>{
  try {
    const db = getDb();
    const userCollection = db.collection('users');
    let userId = req.session.user._id;
    console.log('user ',userId);
    const userData = await userCollection.findOne({_id: new ObjectId(userId)});
    console.log('userdata ',userData);
    res.render('profile',{ title:'Bonito | My Account',userData });
  } catch (error) {
    console.error('Error occured while loading users account: ',error);
    res.json({status:500,message:'Internal Server Problem.'})
  }
}

const editProfileAddress = async(req,res)=>{
  let {
    fname,
    lname,
    email,
    mobile,
    address1,
    address2,
    country,
    city,
    state,
    zipcode,
    id
  } = req.body;
  try {
    const db = getDb();
    const userCollection = db.collection('users');
    const userData = await userCollection.findOne({ _id: new ObjectId(id)})
    if(!userData){
      return res.json({ error: 'User not found.'})
    }
    
    if (userData.addresses.city === city && userData.addresses.state === state) {
      // Update the address properties
      userData.addresses.firstName = fname;
      userData.addresses.lastName = lname;
      userData.addresses.email = email;
      userData.addresses.mobile = mobile;
      userData.addresses.address1 = address1;
      userData.addresses.address2 = address2;
      userData.addresses.country = country;
      userData.addresses.zipcode = zipcode;

      const result = await userCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { addresses: userData.addresses } }
      );

      if (result.modifiedCount === 1) {
        return res.redirect('/checkout');
      } else {
        return res.status(500).json({ error: 'Failed to update user.' });
      }
    } else {
      return res.status(404).json({ error: 'Address not found.' });
    }
  } catch (error) {
    console.error(`error occured while updating address ${error}`);
  }
}

const productReview = async (req, res) => {
  let { rating, reviewMessage, userId, productId } = req.body;
  try {
    const db = getDb();
    let isReviewAdded;
    const userCollection = db.collection('users');
    const reviewObj = {
      rating,
      reviewMessage,
      userId,
      productId,
      date: new Date()
    }
    const result = await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $push: {
          reviews: reviewObj
        }
      }
    );

    if (result.matchedCount > 0) {
      const reviewData = await userCollection
      .find(
        {
          'reviews': {
            $elemMatch: {
              'productId': productId
            }
          }
        }
      ).toArray();
      
      isReviewAdded = true;
      console.log('review data ',reviewData);
      // The update was successful
      console.log('Review submitted successfully.');
      res.status(200).json({ success: true, message: 'Thankyou for Review.',reviewData,isReviewAdded });
    } else {
      // No matching user found
      console.log('User not found for the given userId.');
      res.status(404).json({ success: false, message: 'User not found for the given userId.' });
    }
  } catch (error) {
    console.error('Error occurred while submitting product review. ', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const productSearch = async(req,res)=>{
  const { q } = req.query
  try {
    console.log('data for search is: ',q);

    let result = await performSearch(q);
    console.log('data',result);
    res.json({result})
  } catch (error) {
    console.log('error occured while search products: ',error);
  }
}

async function performSearch(searchTerm){
  const db = getDb();
  const brandCollection = db.collection('brand');
  const categoryCollection = db.collection('category');
  const productCollection = db.collection('products');

  const brandResults = await brandCollection.find({brandName: { $regex: searchTerm, $options: 'i'}}).toArray();
  const categoryResults = await categoryCollection.find({categoryName: { $regex: searchTerm, $options: 'i'}}).toArray();
  const productResults = await productCollection.find({title: { $regex: searchTerm, $options: 'i'}}).toArray();

  const combinedResults = {
    brand: brandResults,
    category: categoryResults,
    product: productResults
  }

  return combinedResults
}

const logout = async(req,res)=>{
  try {
    delete req.session.user;
    res.redirect('/')
    
  } catch (error) {
    console.error('error occured while logout.',error);
  }
}

const deleteUserAccount = async(req,res)=>{
  const { id } = req.params;
  try {
    const db = getDb();
    const collection = db.collection('users');
    const result = await collection.deleteOne({_id: new ObjectId(id)});
    if(result.deletedCount === 1){
      console.log('Product deleted successfully.');
      res.redirect('/');
    }else{
      res.json({success: false, message: 'Account not found'});
    }
  } catch (error) {
    console.error('error occured while deleting user account.');
  }
}

module.exports = {
  loadHome,
  loadShop,
  loadLogin,
  loadRegister,
  loadOtp,
  loadOtpLogin,
  loadForgotPassword,
  loadProductDetailes,
  loadCheckout,
  loadCart,
  loadOrderView,
  loadProductFromOrder,
  loadShopMenorWomen,
  loadShopBasedCategory,
  loadWishlist,
  loadUserAccount,
  sendLoginOtp,
  sendForgotOtp,
  resendOtp,
  resendLoginOtp,
  resendForgotOtp,
  verifyOtp,
  verifyLogin,
  verifyLoginWithOtp,
  verifyForgotOtp,
  verifyRPPayment,
  resetPassword,
  setAddress,
  addProductToCart,
  addProductToWishlist,
  changeQuantity,
  removeCartItem,
  removeSavedItem,
  editAddress,
  placeOrder,
  successPage,
  shopFilter,
  shopSort,
  productReview,
  productSearch,
  editProfileAddress,
  logout,
  deleteUserAccount
};
