const firebaseConfig = { //all this info is straight from firebase
    apiKey: "AIzaSyAfCWJc3AJsHQgDaLI4SBJqxe4W-apYO_k",
    authDomain: "my-website-auth-7e60f.firebaseapp.com",
    projectId: "my-website-auth-7e60f",
    storageBucket: "my-website-auth-7e60f.appspot.com",
    messagingSenderId: "592812885689",
    appId: "1:592812885689:web:f8ca5edf8c1d963d98fd68"
  };
// initialize firebase w above configureation
firebase.initializeApp(firebaseConfig);

// initialize firebase authentication
const auth = firebase.auth();

// Get form elements
const signupForm = document.getElementById('signup-form');
const emailInput = document.getElementById('signup-email');//email input
const passwordInput = document.getElementById('signup-password');//pw input
const passwordConfirmInput = document.getElementById('signup-password-confirm');//pw confirmation input
const errorMessage = document.getElementById('signup-error-message');//error message

// this deals with sign-up form submission
signupForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Prevent form from submitting normally

  const email = emailInput.value.trim();//get input values and trim whitepaces
  const password = passwordInput.value; //get pwd as a value
  const passwordConfirm = passwordConfirmInput.value; //second pwd value (to check if they are same)

  // empty error message (will fill w error message if pwd dont match/ bad bad pwd)
  errorMessage.textContent = '';

  // see if pwd match
  if (password !== passwordConfirm) {
    errorMessage.textContent = 'Passwords do not match.'; //output error message
    return; //exit function
  }

// validate email format (email regex)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// .test() checks if email follows emailRegex, if it doesnt --> error output
if (!emailRegex.test(email)) {
  errorMessage.textContent = 'Please enter a valid email address.';//output error
  return;//exit function
}

// make password at least 8 characters
if (password.length < 8) {
  errorMessage.textContent = 'Password must be at least 8 characters long.';
  return;
}

 // create new user on firebase using given email/pw
 // provided by firebase to create new users
 auth.createUserWithEmailAndPassword(email, password)
  //if successful --> go to overview page
 .then((userCredential) => {
   window.location.href = 'overview_page.html';
 })
 //if unsuccessful --> error messages
 .catch((error) => {
   // Handle sign-up errors
   const errorCode = error.code; //error code standardized by firebase
   const errorMsg = error.message; //readable error message
   errorMessage.textContent = errorMsg; //display error message
  //console output 
   console.error('Sign-up error:', errorCode, errorMsg);
 });
});
