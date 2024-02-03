# **Bonito e-Commerce Web Application**

Bonito e-Commerce is a stylish and user-friendly web application designed for fashion enthusiasts. This e-Commerce store specializes in offering a wide range of fashion-related dresses for online shoppers. The application is built using Node.js and MongoDB, providing a seamless and secure shopping experience.

![Application Image Samples](/images/bonito_images1.jpg)

## **Table of Contents**
- Introduction
- Requirements
- Installation
- Configuration
- Usage
- API Documentation
- Database Schema
- License
- Acknowledgments

## **Introduction**

Welcome to Bonito, a sophisticated e-Commerce web application that redefines the online shopping experience for fashion enthusiasts. From seamless navigation to cutting-edge technologies, Bonito stands out as a user-friendly and feature-rich platform. Led by a commitment to innovation, we've crafted a platform that not only showcases the latest fashion trends but also prioritizes security and efficiency.

## Admin Side Features:

1. **Effortless Product Management:**
   - Add, edit, and delete products with ease.
   - Support for multiple product uploads, ensuring a diverse product catalog.
   - Utilize advanced cropping tools for visually appealing product presentations.

2. **User Control:**
   - Block or unblock customers as needed, maintaining a secure and controlled environment.

3. **Brand and Category Management:**
   - Seamlessly manage and organize brands and categories for a well-structured product catalog.

4. **Order Management:**
   - Update the status of orders for efficient order processing.

5. **Dynamic Offers and Coupons:**
   - Add new offers and coupons to attract and engage customers.
   - Edit and delete existing offers and coupons effortlessly.

6. **Sales Analytics:**
   - View real-time sales progress through interactive graphs for quick insights.
   - Generate detailed sales reports to analyze trends and make informed decisions.

## Client Side Features:

1. **Product Exploration:**
   - Browse and view a wide array of fashion products.
   - Explore detailed product information for informed purchasing decisions.

2. **Shopping Cart and Wishlist:**
   - Add products to the shopping cart for a streamlined checkout process.
   - Create and manage a wishlist for future purchases.

3. **Address Management:**
   - Add and manage multiple delivery addresses for convenience.

4. **Coupon Application:**
   - Apply coupons to products during the checkout process for discounts.

5. **Review and Feedback:**
   - Write and read product reviews to aid other customers in their purchasing decisions.

6. **User Accounts:**
   - Both users and clients can log in to access personalized features.
   - Clients can register new accounts for a seamless shopping experience.

7. **Secure Purchase Process:**
   - Users can easily add products to the cart and complete the purchase process securely.

## Requirements

To run the Bonito e-Commerce Web Application locally, ensure that you have the following prerequisites installed:

### System Requirements

- [Node.js](https://nodejs.org/) (version v18.15.0 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (version v6.0.6) (installed and running)

### Package Dependencies

Install the required Node.js packages by running the following command in the project root:

```bash
npm install

```

## Installation

Follow these steps to set up and run the Bonito e-Commerce Web Application locally:

### Clone the Repository

```bash
git clone https://github.com/albin-pious/bonito.git
npm install

````
## Configuration

To configure the Bonito e-Commerce Web Application, follow these steps:

1. **Create a `.env` file:**
   - In the root of your project, create a new file named `.env`.

2. **Add the following configurations to your `.env` file:**

   ```env
   # MongoDB Connection URI
   MONGODB_URI=your_mongodb_uri

   # Admin Credentials for login
   ADMIN_EMAIL = pre_defined_admin_email (eg: bonito.cc@gmail.com)
   ADMIN_PASSWORD = pre_defined_admin_password(eg: 123)

   # Email for using Nodemailer
   EMAIL_SERVICE = gmail
   EMAIL_USER = your_email
   EMAIL_PASSWORD = your_google_email_app_password

   # Twilio related Credentials
   TWILIO_ACCOUNT_SID = your_TWILIO_ACCOUNT_SID
   TWILIO_AUTH_TOKEN = your_TWILIO_AUTH_TOKEN
   TWILIO_PHONE_NUMBER = your_TWILIO_PHONE_NUMBER

   # Rezeropay(Payment Gateway) related Credentials
   RAZORPAY_KEY_ID = your_RAZORPAY_KEY_ID
   RAZORPAY_KEY_SECRET = your_RAZORPAY_KEY_SECRET
   ```

## Usage

Follow these steps to effectively use the Bonito e-Commerce Web Application:

### 1. Start the Application

Run the following command in the project root to start the application:

   ```bash
   npm start
   ```
## API Documentation

Explore the APIs provided by the Bonito e-Commerce Web Application to integrate and extend functionalities. The API has separate routes for regular users and administrators.

### User Routes
## Authentication Middleware

User authentication is required for the following routes:

- `/product_detailes/:id`
- `/checkout/:id`
- `/bonito_cart`
- `/add_to_cart/:id`
- `/checkout`
- `/checkout/success_page`
- `/bonito/order_view`
- `/bonito_shop/category/:id`
- `/profile`
- `/user_coupon_page`

To authenticate, include the user's authentication token in the request headers.

## Logout Middleware

Logout is required for the following routes:

- `/register`
- `/login`
- `/resend_otp`
- `/resend_login_otp`
- `/otp_login`
- `/resend_forgot_otp`
- `/forgot_password`

## View Engine and Template Configuration

The application uses EJS as the view engine with views located in the './views/user' directory.

## User Routes

### Home and Authentication

- `GET /`: Load the home page.
- `GET /register`: Load the registration page.
- `GET /login`: Load the login page.
- `POST /homepage`: Verify login with OTP.
- `POST /home`: Verify login.

### Shop and Product Management

- `GET /bonito_shop/`: Load the shop.
- `GET /product_detailes/:id`: Load product details.
- `POST /filter`: Apply shop filters.
- `POST /bonito/sort`: Sort shop products.
- `GET /bonito_search`: Search for products.
- `GET /bonito_custom_store`: Load custom store.

### Cart and Wishlist

- `GET /bonito_cart`: Load the cart.
- `GET /add_to_cart/:id`: Add a product to the cart.
- `POST /change_quantity`: Change product quantity in the cart.
- `POST /remove_item`: Remove item from the cart.
- `GET /bonito_wishlist`: Load the wishlist.
- `GET /save_product/:id`: Save a product to the wishlist.
- `POST /remove_saveditem`: Remove saved item from the wishlist.

### Checkout and Order Management

- `GET /checkout`: Load the checkout page.
- `POST /checkout/add_address`: Add a new address for checkout.
- `POST /checkout/edit_address`: Edit a saved address.
- `POST /place_order`: Place a new order.
- `GET /checkout/success_page`: Load the success page after checkout.
- `POST /verify_payment`: Verify payment status.

### Order View and Review

- `GET /bonito/order_view`: Load the order view.
- `GET /view_order_products/:id`: Load products from a specific order.
- `POST /submit-review`: Submit a product review.

### Account and User Related Routes

- `GET /profile`: Load the user account page.
- `POST /profile/edit_address`: Edit user profile address.
- `GET /user_coupon_page`: Load the user coupon page.
- `POST /apply_bonito_coupon`: Apply a coupon to the user's account.
- `DELETE /delete_user_account/:id`: Delete the user account.

### Logout

- `GET /logout`: Logout the user.

### Admin Routes
## Authentication Middleware

Admin authentication is required for the following routes:

- `/productlist`
- `/product_add`
- `/newbrand`
- `/categorylist`
- `/category_create`
- `/category_edit/:id`
- `/customerlist`
- `/edit_brand/:id`
- `/coupon`
- `/coupon_create`

To authenticate, include the admin's authentication token in the request headers.

## Logout Middleware

Logout is required for the following route:

- `/`

## View Engine and Template Configuration

The admin views are configured using EJS as the view engine with views located in the './views/admin' directory.

## Admin Routes

### Authentication and Dashboard

- `GET /`: Load the admin login page.
- `POST /dashboard`: Verify admin login.
- `GET /dashboard`: Load the admin dashboard.

### Chart and Sales Management

- `POST /line_chart`: Fetch data for line chart.
- `POST /bar_chart`: Fetch data for bar chart.
- `POST /pie_chart`: Fetch data for pie chart.
- `GET /export_pdf_daily_sales`: Export PDF for daily sales.
- `GET /export_pdf_weekly_sales`: Export PDF for weekly sales.
- `GET /export_pdf_yearly_sales`: Export PDF for yearly sales.

### Product Management

- `GET /productlist`: Load the product list.
- `GET /product_add`: Load the add product page.
- `POST /addproduct`: Add a new product.
- `GET /product_edit/:id`: Load the edit product page.
- `POST /editproduct`: Edit a product.
- `GET /getcategories_forbrand/:brandId`: Fetch categories for a brand.
- `DELETE /product_delete/:id`: Delete a product.
- `DELETE /delete_selected_products/:Ids`: Delete selected products.

### Brand Management

- `GET /newbrand`: Load the add brand page.
- `POST /addbrand`: Add a new brand.
- `GET /brand_edit/:id`: Load the edit brand page.
- `POST /editbrand`: Edit a brand.
- `DELETE /brand_delete/:id`: Delete a brand.

### Category Management

- `GET /categorylist`: Load the category list.
- `GET /category_create`: Load the create category page.
- `POST /addcategory`: Add a new category.
- `GET /category_edit/:id`: Load the edit category page.
- `POST /editcategory`: Edit a category.
- `DELETE /category_delete/:id`: Delete a category.

### Customer Management

- `GET /customerlist`: Load the customer list.
- `PUT /customerlist/:action/:id`: Restrict or unrestrict a user.

### Order Management

- `GET /orderlist`: Load the order list.
- `POST /update_status`: Edit order status.

### Coupon Management

- `GET /coupon`: Load the coupon list.
- `GET /coupon_create`: Load the create coupon page.
- `POST /createcoupon`: Create a new coupon.
- `GET /coupon_editpage/:id`: Load the edit coupon page.
- `POST /edit_coupon`: Edit a coupon.
- `DELETE /coupon_delete/:id`: Delete a coupon.

### Admin Logout

- `GET /logout`: Logout the admin.

## Collections

### 1. users 
- `_id`: ObjectId (Automatically generated unique identifier)
- `name`: String (Username of the user)
- `email`: String (email of the user)
- `password`: String (Password of the user)
- `mobile`: String (Mobile Number of the user)
- `role`: String (Identify the user type)
- `blocked`: Boolean (Toggle for block unblock)
- `addresses`: Object (Delivery address of user)
- `reviews`: Array (Reviews of the user)
- `coupons`: Array (Coupons of the user)
### 2. products
- `_id`: ObjectId (Automatically generated unique identifier)
- `title`: String (Title of the product)
- `description`: String (Description of the product)
- `price`: Int32 (Price of the product)
- `offer`: String (Offer of the product)
- `sizeUnits`: Object (Sizes of the product)
- `brand`: String (Brand _id as string from brand collection)
- `images`: Array (Product Images URLs)
- `categoryId`: String (Category ID _id as string from category collection)
### 3. order
- `_id`: ObjectId (Automatically generated unique identifier)
- `userId`: ObjectId (_id from user collection)
- `productDetails`: Array (Detailes of Ordered products)
- `totalPrice`: Int32 (Total amount of Ordered products)
- `orderDate`: Date (purchased date)
- `deliveryDate`: Date (delivery expect date)
- `status`: String (Status of order)
- `address`: Object (Delivery address)
- `paymentType`: String (Method of payment)
- `coupon`: Object (Applied coupon detailes)
### 4. brand
- `_id`: ObjectId (Automatically generated unique identifier)
- `brandName`: String (Name of the brand)
- `categoryId`: Array (_ids from category collection)
### 5. cart
- `_id`: ObjectId (Automatically generated unique identifier)
- `userId`: ObjectId (_id from user collection)
- `productId`: Array (product detailes in the cart)
### 6. category
- `_id`: ObjectId (Automatically generated unique identifier)
- `categoryName`: String (Name of the category)
### 7. coupons
- `_id`: ObjectId (Automatically generated unique identifier)
- `couponName`: String (Name of the coupon)
- `couponCode`: String (Unique code of the coupon)
- `couponOffer`: String (Offer of the coupon)
- `minAmount`: String (Minimum Purchase required)
- `expireDate`: Date (expire date)
- `brand`: String (_id from brand collection or 'ALL' brnads)
- `category`: String (_id from category collection or 'ALL' brnads)
- `status`: String (coupon status)
- `usedBy`: Int32 (No. of user use this coupon)
- `apply`: String (Where to give coupon to user)
### 5. wishlist
- `_id`: ObjectId (Automatically generated unique identifier)
- `userId`: ObjectId (_id from user collection)
- `productId`: Array (product detailes in the cart)



   




 
