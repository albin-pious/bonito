const express = require('express');
const userRouter = express();
const auth = require('../middleware/auth');
const userCtrl = require('../controllers/userController');

userRouter.set('view engine','ejs');
userRouter.set('views','./views/user');

userRouter.get('/',userCtrl.loadHome);
userRouter.get('/register',userCtrl.loadRegister);
userRouter.get('/login',userCtrl.loadLogin);
userRouter.get('/resend_otp',userCtrl.loadOtp);

userRouter.post('/register',userCtrl.loadOtp);
userRouter.post('/otp',userCtrl.verifyOtp);

userRouter.post('/home',userCtrl.verifyLogin);


module.exports = userRouter;
