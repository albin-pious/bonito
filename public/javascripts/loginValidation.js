const loginEmail = document.getElementById('email');
const loginPassword = document.getElementById('password');
const loginemailError = document.getElementById('emailError');
const loginpasswordError = document.getElementById('passwordError');
let emailValue = false;
let passwordValue = false;

function enableLoginButton(){
    const submitButton = document.getElementById('login');
    if(emailValue && passwordValue){
        submitButton.removeAttribute('disabled');
    } else {
        submitButton.setAttribute('disabled','disabled');
    }
}

function validateLoginEmail(){
    const emailData = emailInput.value.trim();
    const emailPattern = new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    if (!emailPattern.test(emailData)) {
        loginemailError.textContent = "Email should be in proper format";
    } else {
        loginemailError.textContent = "";
        emailValue = true;
        enableLoginButton();
    }
}

function validateloginPassword(){
    const passwordData = passwordInput.value.trim();
    if (passwordData.length < 6) {
        loginpasswordError.textContent = "Password must be more than 6 characters";
    } else {
        loginpasswordError.textContent = "";
        passwordValue = true;
        enableLoginButton();
    }
}

// OTP Login Page
const loginMobileInput = document.getElementById('mobile');
const loginMobileError = document.getElementById('mobileError');
let mobileValue = false;

function enableOTPLoginButton() {
  const otpSendButton = document.getElementById('sendOTP');
  if (mobileValue) {
    otpSendButton.removeAttribute('disabled');
  } else {
    otpSendButton.setAttribute('disabled', 'disabled');
  }
}

function validateLoginMobile() {
  const mobileData = loginMobileInput.value.trim();
  const mobilePattern = /^[0-9]{10}$/;
  if (!mobilePattern.test(mobileData)) {
    loginMobileError.textContent = 'Invalid mobile number (10 digits)';
    mobileValue = false;
  } else {
    loginMobileError.textContent = '';
    mobileValue = true;
  }
  enableOTPLoginButton();
}

// Event listener for mobile input
loginMobileInput.addEventListener('input', validateLoginMobile);

// Event listener for form submission
const mobileNumberForm = document.getElementById('mobileNumberForm');
mobileNumberForm.addEventListener('submit', (event) => {
  event.preventDefault();  // Prevent the default form submission
  validateLoginMobile();  // Validate mobile before submission
  if (mobileValue) {
    // Submit the form if mobile is valid
    mobileNumberForm.submit();
  }
});




