

// JavaScript code for handling the timer
const timerElement = document.getElementById("timer");
console.log(timerElement);
let seconds = 60; // Set the initial time in seconds
function startTimer(seconds) {
  const timerInterval = setInterval(function () {
    seconds--;
    timerElement.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(timerInterval); // Stop the timer when it reaches 0
      // You can optionally trigger a resend OTP action here
    }
  }, 1000); // Update the timer every 1 second (1000 milliseconds)
}
startTimer(seconds); // Start the timer when the page loads
