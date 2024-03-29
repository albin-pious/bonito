const express = require('express');
const userRouter = express();
const auth = require('../middleware/auth');
const userCtrl = require('../controllers/userController');
const couponCtrl = require('../controllers/couponController');

userRouter.use(['/product_detailes/:id','/checkout/:id','/bonito_cart','/add_to_cart/:id','/checkout','checkout/success_page',
'/bonito/order_view','/bonito_shop/category/:id','/profile','/user_coupon_page',
],auth.userLogin);

userRouter.use(['/register','/login','/resend_otp','/resend_login_otp','/otp_login','/resend_forgot_otp','/forgot_password',],auth.userLogOut);

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

// Filtering, Sorting, Searching and Load Shop
userRouter.get('/bonito_shop/',userCtrl.loadShop);
userRouter.get('/product_detailes/:id',userCtrl.loadProductDetailes);
userRouter.post('/filter',userCtrl.shopFilter);
userRouter.post('/bonito/sort',userCtrl.shopSort);
userRouter.get('/bonito_search',userCtrl.productSearch);
userRouter.get('/bonito_custom_store',userCtrl.loadShopMenorWomen);

// cart & whishlist 
userRouter.get('/bonito_cart',userCtrl.loadCart);
userRouter.get('/add_to_cart/:id',userCtrl.addProductToCart);
userRouter.post('/change_quantity',userCtrl.changeQuantity);
userRouter.post('/remove_item',userCtrl.removeCartItem);
userRouter.get('/bonito_wishlist',userCtrl.loadWishlist);
userRouter.get('/save_product/:id',userCtrl.addProductToWishlist);
userRouter.post('/remove_saveditem',userCtrl.removeSavedItem);

// checkout
userRouter.get('/checkout',userCtrl.loadCheckout);
userRouter.post('/checkout/add_address',userCtrl.setAddress);
userRouter.post('/checkout/edit_address',userCtrl.editAddress);
userRouter.post('/place_order',userCtrl.placeOrder);
userRouter.get('/checkout/success_page',userCtrl.successPage);
userRouter.post('/verify_payment',userCtrl.verifyRPPayment);

// order
userRouter.get('/bonito/order_view',userCtrl.loadOrderView);
userRouter.get('/view_order_products/:id',userCtrl.loadProductFromOrder);
userRouter.post('/submit-review',userCtrl.productReview);

// account and other related routes.
userRouter.get('/profile',userCtrl.loadUserAccount);
userRouter.post('/profile/edit_address',userCtrl.editProfileAddress);
userRouter.get('/user_coupon_page',couponCtrl.loadUserCoupon);
userRouter.post('/apply_bonito_coupon',couponCtrl.applyCoupon);
userRouter.delete('/delete_user_account/:id',userCtrl.deleteUserAccount)

// User LogOut
userRouter.get('/logout',userCtrl.logout);

module.exports = userRouter;
