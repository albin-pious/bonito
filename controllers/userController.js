const User = require('../models/userModel');
const { getDb } = require('../config/dbConnect');
const otpService = require('../utilities/otpService');

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const loadHome = async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection('users');
    let userData = null;
    if (req.session.user) {
      const userId = req.session.user;
      userData = await collection.findOne({ _id: userId });
      res.render('home', { userData: userData });
    }
    res.render('home');
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    res.render('login',{message:'',title:""});
  } catch (error) {
    console.log(error.message);
  }
};

const loadOtpLogin = async(req,res)=>{
  try {
    res.render('otpLogin')
  } catch (error) {
    console.log(error);
  }
}

const loadRegister = async (req, res) => {
  try {
    res.render('register');
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
          return res.render('otpVerify')
        }
      }else{
        return res.render('register',{message:'email or mobile is already existing.'})
      }
    }else{
      return res.render('register',{message:'email or password is already existing.'})
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
      return res.render('register', { message: 'Please redirect to the login page.' });
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

    return res.render('otpVerify');
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
    res.send('Please signup agin')
  }
  console.log('user data from verify login: ',userData);
  try {
    if (!userData) {
      return res.render('otpVerify', { message: 'Invalid OTP request...' });
    }
    console.log('value of userData.generateOTP',userData.generatedOTP);
    if (otp === userData.generatedOTP) {
      const { name, email, password, mobile } = userData;

      const db = getDb();
      const collection = db.collection('users');
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User(name, email, hashedPassword, mobile);

      const result = await collection.insertOne(newUser);
      delete req.session.userData;
      res.render('login', { title: 'Registration completed. Please Login',message:'' });
    } else {
      return res.render('otpVerify', { message: 'Invalid OTP.' });
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
      const smsSend = await otpService.sendOtpSMS(completeNumber,generatedOTP)
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
        return res.render('otpLogin',{message:`Otp send failed to mobile number please try again later.`})
      }
      res.render('smsVerify');
      }else{
        return res.render('otpLogin',{message:`number doesn't exit`})
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
      return res.render('smsVerify',{message:'Please try again late.'});
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
            return res.render('login',{message:'Your account is blocked.'});
          }
          req.session.user = user._id;
          console.log('session is : ', req.session.user);
          return res.render('home', { userData: user });
        } else {
          return res.render('login', { message: 'permission denied.' });
        }
      } else {
        return res.render('login', { message: 'e-mail or password are incorrect.' });
      }
    } else {
      return res.render('login', { message: 'e-mail or password incorrect' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('An error occurred during login');
  }
};

const verifyLoginWithOtp = async(req,res)=>{
  const {otp}=req.body;
  try {
    console.log('otp from reqBody ',otp);
    const userData = req.session.loginData;
    const storedOTP = userData.generatedOTP;
    console.log('stored otp is: ',storedOTP); 
    console.log('loginData in verify login is ',userData)
    if(!userData){
      return res.render('smsVerify',{message:'Failed to locate user.'})
    }
    console.log('value of userData.generatedOTP is: ',userData.generatedOTP);
    if(otp===storedOTP){
      if(userData.role==='User'){
        if(userData.blocked){
          return res.render('smsVerify',{message:'your account is blocked.'})
        }
        req.session.user = userData._id;
        delete req.session.loginData;
        console.log('session is ',req.session.user);
        return res.render('home', { userData: userData });
      }else{
        return res.render('smsVerify',{message:'not permitted to this section.'})
      }
    }else{
      return res.render('otpVerify',{message:'Invalid OTP'});
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
        return res.render('forgotPasswordView',{message:`email doesn't exit please register.`})
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
      res.render('forgotPasswordEnter');
      setTimeout(() => {
        delete req.session.emailUserDetailes.generatedOTP;
        console.log('otp for forgot password is deleted.');
      }, 60*1000);
    } else{
      const user = await collection.findOne({mobile});
      console.log('user data using mobile is: ',user);
      if(!user){
        return res.render('forgotPasswordView',{message:`email doesn't exit please register.`});
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
    res.render('forgotPasswordEnter');
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
      return res.render('forgotPasswordEnter',{message:'Please try again later.'})
    }
    if(email){
      const generatedOTP = await otpService.generateOTP();
      console.log('regenerated otp is :',generatedOTP);  
      req.session.emailUserDetailes.generatedOTP=generatedOTP;
      await otpService.sendOtp(email,generatedOTP);
      res.render('forgotPasswordEnter');
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
      res.render('forgotPasswordEnter');
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
        return res.render('forgotPasswordEnter',{message:'Please type registered email'})
      }
    }else{
      const mobile = otpViaMobile;
      user = await collection.findOne({mobile});
      if(!user){
        return res.render('forgotPasswordEnter',{message:'Please type registered mobile number'});
      }
    }
    if(otp===sesseionData.generatedOTP){
      res.render('resetPassword');
    }else{
      return res.render('forgotPasswordEnter',{message:'Invalid OTP.'})
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
      return res.render('resetPassword', { message: 'Confirm password is incorrect.' });
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
      res.render('login',{message:'Password reset successfull, please login.'})
    }
    res.render('resetPassword',)

  } catch (error) {
    console.log('Error occurred while resetting password:', error);
  }
}


module.exports = {
  loadHome,
  loadLogin,
  loadRegister,
  loadOtp,
  loadOtpLogin,
  loadForgotPassword,
  sendLoginOtp,
  sendForgotOtp,
  resendOtp,
  resendLoginOtp,
  resendForgotOtp,
  verifyOtp,
  verifyLogin,
  verifyLoginWithOtp,
  verifyForgotOtp,
  resetPassword
};
