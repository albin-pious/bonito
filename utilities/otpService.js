const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv').config();
const twilio = require('twilio');

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});


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

// neccessary components for send sms over twilio.
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid,authToken)

function sendOtpSMS(mobile,otp){
  const smsMessage = `Your OTP (One-Time Password) is: ${otp}`;
  return client.messages
    .create({
      body: smsMessage,
      from: twilioPhoneNumber,
      to: mobile
    })
    .then((message)=>{
      console.log('SMS send successfully: ',message.sid);
      return true;
    })
    .catch((error)=>{
      console.error('Error sending SMS: ',error.message);
      throw new Error('Error sending OTP via SMS: ',error.message)
    })
}  

module.exports = { generateOTP, sendOtp, sendOtpSMS };