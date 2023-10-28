const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const dotenv = require('dotenv').config();
const crypto = require('crypto');

// db connection
const dbConnection = require('./config/dbConnect')
dbConnection.dbConnection().then().catch((error)=>{
  console.log('Failed to connect the databae', error);
})

const userRouter = require('./routes/userRoute');
const adminRouter = require('./routes/adminRoute');
const { error, log } = require('console');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads',express.static('public/uploads'))

const generateSecret = ()=>{
  // Generate a 128-character (64-byte) hex string
  return crypto.randomBytes(64).toString('hex');
}
const sessionSecret = generateSecret();
console.log(sessionSecret);
app.use(session({
  secret:'my secret key',
  resave:false,
  saveUninitialized:true,
  cookie:{
    maxAge: 3*3600000,
    sameSite:true
  }
}))

app.use('/', userRouter);
app.use('/admin', adminRouter);

app.use((req, res, next) => {
  res.header("cache-control", "no-cache private,no-store,must-revalidate,max-stale=0,post-check=0,pre--check=0");
  next();
}) 

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
