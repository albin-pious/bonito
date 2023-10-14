// client-side validation register form
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const mobileInput = document.getElementById("mobile");
const messageElement = document.getElementById("successMessage");

const nameError = document.getElementById("nameError");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const mobileError = document.getElementById("mobileError");

let username = false;
let usereamil = false;
let userpassword = false;
let usermobile = false;

function enableSubmitButton(){
    const submitButton = document.getElementById('register');
    if(username && usereamil && userpassword && usermobile){
        submitButton.removeAttribute('disabled');
    }else{
        submitButton.setAttribute('disabled','disabled');
    }    
}


  function validateName() {
    const nameValue = nameInput.value.trim();
    const namePattern = /^[a-zA-Z][a-zA-Z.\s-]{2,}$/;
    if (nameValue === "") {
      nameError.textContent = "Name is required";
    } else if(!namePattern.test(nameValue)){
      nameError.textContent = "Name is invalid"
    } else {
      nameError.textContent = "";
      username = true;
      enableSubmitButton();
    }
  }

  function validateEmail() {
    const emailValue = emailInput.value.trim();
    const emailPattern = new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    if (!emailPattern.test(emailValue)) {
      emailError.textContent = "Invalid email address";
    } else {
      emailError.textContent = "";
      usereamil = true;
      enableSubmitButton();
    }
  }

  function validatePassword() {
    const passwordValue = passwordInput.value.trim();
    if (passwordValue.length < 6) {
      passwordError.textContent = "Password must be at least 6 characters";
    } else {
      passwordError.textContent = "";
      userpassword = true;
      enableSubmitButton();
    }
  }

  function validateMobile() {
    const mobileValue = mobileInput.value.trim();
    const mobilePattern = /^[0-9]{10}$/;
    if (!mobilePattern.test(mobileValue)) {
      mobileError.textContent = "Invalid mobile number (10 digits)";
    } else {
      mobileError.textContent = "";
      usermobile = true;
      enableSubmitButton();
    }
  }

// client side validation for login page.





  
  
