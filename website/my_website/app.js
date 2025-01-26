//my firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfCWJc3AJsHQgDaLI4SBJqxe4W-apYO_k",
  authDomain: "my-website-auth-7e60f.firebaseapp.com",
  projectId: "my-website-auth-7e60f",
  storageBucket: "my-website-auth-7e60f.appspot.com",
  messagingSenderId: "592812885689",
  appId: "1:592812885689:web:f8ca5edf8c1d963d98fd68"
};

//initialize firebase w above coniguration
firebase.initializeApp(firebaseConfig);
//refrence to authentication
const auth = firebase.auth();

//elements
const loginForm = document.getElementById('login-form'); //get login form element
const emailInput = document.getElementById('email');//get email input
const passwordInput = document.getElementById('password');//get pw input field
const errorMessage = document.getElementById('error-message');//element for error message

//login form interaction
//this adds 'event listener' for submit event
loginForm.addEventListener('submit', (e) => {
  e.preventDefault(); // this prevent form from submitting then outputs to console
  console.log('Login form submitted.');

  const email = emailInput.value; //gets email value from user
  const password = passwordInput.value; //gets pw value from user

  // uses firebase to login w email + pw
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      window.location.href = 'overview_page.html'; //if successful submission, redirects u to overview page
    })
    .catch((error) => {
      //if unsuccessful submission --> error message + console error message
      errorMessage.textContent = 'Incorrect email or password.';
      console.error('Login error:', error);
    });
});