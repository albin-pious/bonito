const User = require('../models/userModel');
const { getDb} = require('../config/dbConnect');
const otpService = require('../utilities/otpService');

const bcrypt = require('bcrypt');

// global variables
let saveOtp = null;
let userData = {
    name:'',
    email:'',
    password:'',
    mobile:'',
}

const loadHome = async (req,res)=>{
    try {
        const db=getDb();
        const collection = db.collection('users');
        let userData = null;
        if(req.session.user){
            let userId;
            userId = req.session.user 
            userData = await collection.findOne({_id:userId})
            res.render('home',{userData:userData})      
        }
        res.render('home')
    } catch (error) {
        console.log(error.message);
    }
}

const loadLogin = async (req,res)=>{
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
}

const loadRegister = async (req,res)=>{
    try {
        res.render('register')
    } catch (error) {
        console.log(error);
    }
}

const loadOtp = async (req,res)=>{
    console.log('testing');
    const { name,email,password,mobile } = req.body
    console.log(name,email,password,mobile)
    try {
        const db = getDb();
        const collection = db.collection('users');
        const userWithEmail = await collection.findOne({ email });
        const userWithMobile = await collection.findOne({ mobile });
        if(userWithEmail){
            return res.render('register',{message:'E-Mail already exists in Bonito.'});
        }
        if(userWithMobile){
            return res.render('register',{message:'Mobile number is already exists in Bonito.'})
        }
        if(!userWithEmail){
            if(!saveOtp){
                let generateOTP = otpService.generateOTP();
                saveOtp = generateOTP;
                userData = {name,email,password,mobile};
                otpService.sendOtp(email,generateOTP); 
                res.render('otpVerify');
                setTimeout(() => {
                    saveOtp = null;
                },60 * 1000);
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const verifyOtp = async (req, res) => {
    const { otp } = req.body;
    console.log('hai');
    console.log(otp);
    try {
        console.log(saveOtp);
        if (otp == saveOtp) {
            // Make sure to get the password from userData
            const { name, email, password, mobile } = userData; // Get password from userData
            const db = getDb();
            console.log('hai');
            const collection = db.collection('users');
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User(name, email, hashedPassword, mobile);
            console.log(newUser);
            const result = await collection.insertOne(newUser);
            res.render('login', { message: 'Registration completed. Please Login' });
        } else {
            return res.render('otpVerify', { message: 'Invalid OTP.' });
        }
    } catch (error) {
        console.error('Error during user registration:', error);
        // Handle the error, possibly by rendering an error page or returning an error message to the client.
        res.status(500).send('An error occurred during registration.');
    }
};

const verifyLogin = async (req,res)=>{
    const {email,password} = req.body;
    try {
        const db = getDb();
        const collection = db.collection('users');
        const user = await collection.findOne({email});
        if(user){
            const passwordMatch = await bcrypt.compare(password,user.password);
            if(passwordMatch){
                console.log('user role is',user.role);
                if(user.role === 'User'){
                    req.session.user = user._id;
                    console.log('session is : ',req.session.user);
                    return res.render('home',{userData:user});
                }else{
                    return res.render('login',{message:'permission denied.'})
                }
            }else{
                return res.render('login',{message:'e-mail or password are incorrect.'});
            }
        }else{
            return res.render('login',{message:'e-mail or password incorrect'});
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('An error occurred during login');
    }
}

module.exports = {
    loadHome,
    loadLogin,
    loadRegister,
    loadOtp,
    verifyOtp,
    verifyLogin
}