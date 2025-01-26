//references to dom elements
const searchInput = document.getElementById('search-input');//search input field
const searchButton = document.getElementById('search-button');//search button
const videoItems = document.querySelectorAll('.video-item'); //video items
const errorMessage = document.getElementById('error-message');//eorry message

//get model IDs + make upercase (rn doesnt matter bc numbers.. this is incase I change names)
const modelIds = Array.from(videoItems).map(item => item.getAttribute('data-id').toUpperCase());

//makes search button clickable
searchButton.addEventListener('click', () => {
  handleSearch(); //when button is clicked --> calls search handler
});

//search button, when enter button is released it will search
searchInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') { //when 'enter' key is pressed
    handleSearch(); //calls search
  }
});

//handles search --> navigate to video page
function handleSearch() {
  const searchTerm = searchInput.value.trim().toUpperCase(); //trims + uppercase
  if (searchTerm) { //make sure not empty
    if (modelIds.includes(searchTerm)) {
      //if model id exists --> videopage
      navigateToVideoPage(searchTerm);
    } else {
      //if model id doesnt exist --> error message
      displayErrorMessage('Model ID not found. Please try again.');
    }
  } else {
    displayErrorMessage('Please enter a Model ID.');
  }
}

//video block clickable --> navigate to video page
videoItems.forEach((item) => {
  item.addEventListener('click', () => {
    const videoId = item.getAttribute('data-id'); //gets data-id and assigns to 'video id'
    navigateToVideoPage(videoId); //go to respective video stream
  });
});

//navigate to video page
function navigateToVideoPage(videoId) {
  //-->video_page.html for specific video id
  window.location.href = `video_page.html?videoId=${encodeURIComponent(videoId)}`;
}

//error message
function displayErrorMessage(message) {
  errorMessage.textContent = message; //set error message text
  errorMessage.style.display = 'block'; //display error message
}
//make error message go away when typing
searchInput.addEventListener('input', () => {
  errorMessage.style.display = 'none'; //makes error message disapere
});

//websocket (remove later--not needed here)
ws.on('message', message => {
  const data = JSON.parse(message);
  if (data.videoId) {
    ws.videoId = data.videoId;
  }
});

ws.onopen = () => {
  console.log('Connected to WebSocket server');
  ws.send(JSON.stringify({ videoId }));
};
