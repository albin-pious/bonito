

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



// Event listener for form submission
if(loginMobileInput){
  // Event listener for mobile input
  loginMobileInput.addEventListener('input', validateLoginMobile);

  const mobileNumberForm = document.getElementById('mobileNumberForm');
  mobileNumberForm.addEventListener('submit', (event) => {
    event.preventDefault();  // Prevent the default form submission
    validateLoginMobile();  // Validate mobile before submission
    if (mobileValue) {
      // Submit the form if mobile is valid
      mobileNumberForm.submit();
    }
  });
}else{
  console.error('Could not find the element with ID "mobile"');
}





