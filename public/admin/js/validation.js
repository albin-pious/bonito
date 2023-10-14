const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

let userEmail = false;
let userPassword = false;

function enableSubmitButton(){
    const submitButton = document.getElementById('login');
    if(userEmail && userPassword){
        submitButton.removeAttribute('disabled');
    } else {
        submitButton.setAttribute('disabled', 'disabled');
    }    
}

function validateEmail() {
    const emailValue = emailInput.value.trim();
    const emailPattern = new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    if (!emailPattern.test(emailValue)) {
        emailError.textContent = "Invalid email address";
    } else {
        emailError.textContent = "";
        userEmail = true;
        enableSubmitButton();
    }
}

function validatePassword() {
    const passwordInput = document.getElementById("password");  
    const passwordError = document.getElementById("passwordError");  
    
    const passwordValue = passwordInput.value.trim();
    if (passwordValue.length < 6) {
        passwordError.textContent = "Password must be at least 6 characters";
    } else {
        passwordError.textContent = "";
        userPassword = true;
        enableSubmitButton();
    }
}

emailInput.addEventListener('input',validateEmail);
emailInput.addEventListener('input',validatePassword);


  