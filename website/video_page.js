// get the videoId parameter from the URL
const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get('videoId');

// element that displays model id
const modelIdDisplay = document.getElementById('model-id-display');

// add model id to textcontent
if (modelIdDisplay) {
  modelIdDisplay.textContent = `MODEL ID: ${videoId}`;
} else {//if element is missing, log error
  console.error('Model ID display element not found.');
}
//element that displays video stream
const videoStream = document.getElementById('video-stream');

//this function routes video id to their respective websocket url
function getVideoSource(videoId) {
  // Map of video IDs to their respective WebSocket URLs
  const videoSources = {
    '001': 'ws://localhost:8080/stream001', //websocket url for 001
    '002': 'ws://localhost:8080/stream002', //websocket url for 002
    // model IDs 003, 004, 005 do not have streams
  };

  // return the corresponding websocket URL
  return videoSources[videoId];
}

//function that starts websocket connection
function startWebSocket() {
  //this gets specific websocket url for videoid
  const videoSource = getVideoSource(videoId);

  //if videosource is not found
  if (!videoSource) {
    //display error message
    displayEmptyStreamMessage(videoId, 'No video stream available for this MODEL ID.');
    return;
  }

  //this will establish websocket connection for specific URL
  const ws = new WebSocket(videoSource);

  //websocket connection was successful, givemessage for console
  ws.onopen = () => {
    console.log('Connected to WebSocket server for videoId:', videoId);
  };

  //when a message is received from server
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data); //parse through json message

    if (data.image) {
      //if image is recieved from server, set it to video stream element
      videoStream.src = `data:image/jpeg;base64,${data.image}`;
    } else if (data.message) {
      //if message is recived instead, display it and disconnect from websocket
      displayEmptyStreamMessage(videoId, data.message);
      ws.close(); //closing websocket
    } else if (data.error) {
      //if error message is recived instead, display it and disconnect from websocket
      displayEmptyStreamMessage(videoId, data.error);
      ws.close(); //closing websocket
    }
  };

  //if an error event occurs
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    //error message outputed to console
    displayEmptyStreamMessage(videoId, 'Failed to connect to the video stream.');
  };

  //websocket closed event
  ws.onclose = () => {
    //outputs to console
    console.log('WebSocket connection closed');
    // error message if stream ends unexpectidely
    if (!videoStream.src) {
      displayEmptyStreamMessage(videoId, 'The video stream has ended.');
    }
  };
}

//this function displays message when there is no stream 
function displayEmptyStreamMessage(videoId, message) {
  // remove video stream element
  if (videoStream) {
    videoStream.style.display = 'none';//hide element
  }

  // this sees if message element exists
  let messageElement = document.getElementById('empty-stream-message');

  //if it doesnt exist, this will create it
  if (!messageElement) {
    // Create a new message element
    messageElement = document.createElement('p'); //creates <p> element (paragraph)
    messageElement.id = 'empty-stream-message'; //set ID
    messageElement.style.fontSize = '1.5em'; //font size
    messageElement.style.textAlign = 'center';//center align
    messageElement.style.marginTop = '20px'; //padding above

    //now append message to video container or the body
    const container = document.getElementById('video-container') || document.body;
    container.appendChild(messageElement);
  }

  //set message
  messageElement.textContent = message;
}

// start websocket connection
startWebSocket();

//back to overview page button
const backButton = document.getElementById('back-button'); //refrence button
backButton.addEventListener('click', () => {
  window.location.href = 'overview_page.html'; //redirects to overview page when clicked
});

//back to map page button
const backToMapButton = document.getElementById('back-to-map-button'); //refrence button
backToMapButton.addEventListener('click', () => {
  window.location.href = 'map_builder.html';//redirect to map builder page when clicked
});
