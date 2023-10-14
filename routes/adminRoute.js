const  express = require('express');
const adminRouter = express();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const isAdminLogin = require('../middleware/adminLoginAuth');


const store = require('../helpers/multer');

adminRouter.set('view engine','ejs');
adminRouter.set('views','./views/admin');

adminRouter.use(['/productlist', '/product_add', '/newbrand', '/categorylist', '/category_create', '/category_edit/:id', '/customerlist','/edit_brand/:id'], auth.adminLogin);


adminRouter.get('/',auth.adminLogOut,adminController.loadLogin);
adminRouter.post('/dashboard',adminController.verifyLogin);
adminRouter.get('/dashboard',auth.adminLogin,adminController.loadHome);

// *********** PRODUCT MANAGEMENT *********** //
adminRouter.get('/productlist',adminController.loadProductList);
adminRouter.get('/product_add',adminController.loadProductAdd);
adminRouter.post('/addproduct',store.array('images'),adminController.addNewProduct);
adminRouter.get('/product_edit/:id',adminController.loadEditProduct);
adminRouter.get('/getcategories_forbrand/:brandId',adminController.catForBrand);

// *********** BRAND MANAGEMENT *********** //
adminRouter.get('/newbrand',adminController.loadBrandAdd);
adminRouter.post('/addbrand',adminController.addNewBrand);
adminRouter.get('/brand_edit/:id',adminController.LoadEditBrand);
adminRouter.post('/editbrand',adminController.editBrand);
adminRouter.delete('/brand_delete/:id',adminController.deleteBrand);

// *********** CATEGORY MANAGEMENT *********** //
adminRouter.get('/categorylist',adminController.loadCategory);
adminRouter.get('/category_create',adminController.loadCreateCategory);
adminRouter.post('/addcategory',adminController.addNewCategory);
adminRouter.get('/category_edit/:id',adminController.loadeditCategory);
adminRouter.post('/editcategory',adminController.editCategory);
adminRouter.delete('/category_delete/:id',adminController.deleteCategory);

// *********** CUSTOMER MANAGEMENT *********** //
adminRouter.get('/customerlist',adminController.loadCustomer);
adminRouter.put('/customerlist/:action/:id',adminController.restrictUser);



module.exports = adminRouter;
