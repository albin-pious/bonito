const express = require('express');
const userRouter = express();
const auth = require('../middleware/auth');
const userCtrl = require('../controllers/userController');

userRouter.set('view engine','ejs');
userRouter.set('views','./views/user');

userRouter.get('/',userCtrl.loadHome);
userRouter.get('/register',userCtrl.loadRegister);
userRouter.get('/login',userCtrl.loadLogin);

userRouter.post('/homepage',userCtrl.verifyLoginWithOtp);
userRouter.post('/home',userCtrl.verifyLogin);

// otp related routes
userRouter.get('/resend_otp',userCtrl.resendOtp);
userRouter.get('/resend_login_otp',userCtrl.resendLoginOtp)
userRouter.get('/otp_login',userCtrl.loadOtpLogin);
userRouter.post('/register',userCtrl.loadOtp);
userRouter.post('/otp',userCtrl.verifyOtp);
userRouter.post('/send_login_otp',userCtrl.sendLoginOtp);

// forgot password
userRouter.get('/resend_forgot_otp',userCtrl.resendForgotOtp)
userRouter.get('/forgot_password',userCtrl.loadForgotPassword);
userRouter.post('/forgot_password',userCtrl.sendForgotOtp);
userRouter.post('/verify_forgot_otp',userCtrl.verifyForgotOtp);
userRouter.post('/reset_password',userCtrl.resetPassword);






module.exports = userRouter;
