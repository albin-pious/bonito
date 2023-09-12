const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv').config();

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// OTP expiration time (5 minutes in milliseconds)
const otpExpiration = 5 * 60 * 1000;

// Function to generate a random OTP
function generateOTP() {
  const otp = crypto.randomBytes(3).toString('hex').toUpperCase();
  console.log(otp);
  return otp;
}

// Function to send OTP via email
function sendOtp(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for Login',
    text: `Your OTP (One-Time Password) is: ${otp}`,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending OTP:', error);
        reject(error);
      } else {
        console.log('OTP sent:', info.response);
        resolve(true);
      }
    });
  });
}

// Function to verify OTP
function verifyOTP(user, otp) {
  const currentTime = new Date().getTime();

  if (
    user.otp &&
    otp === user.otp.value &&
    currentTime - user.otp.timestamp <= otpExpiration
  ) {
    // Mark the OTP as used
    user.otp = null;
    return true;
  }
  return false;
}

module.exports = { generateOTP, sendOtp, verifyOTP };