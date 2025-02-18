/*
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Middleware to parse incoming requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Endpoint to receive JPEG images from the ESP32
app.post('/upload', (req, res) => {
  const imageData = req.body.image; // Assuming the image is sent as base64
  if (!imageData) {
    return res.status(400).send('No image data received');
  }

  // Convert base64 to buffer
  const buffer = Buffer.from(imageData, 'base64');

  // Save the image to a file
  const imagePath = path.join(__dirname, 'images', 'latest.jpg');
  fs.writeFileSync(imagePath, buffer);

  console.log('Image saved:', imagePath);
  res.status(200).send('Image received');
});

// Serve the latest image to the client
app.get('/latest-image', (req, res) => {
  const imagePath = path.join(__dirname, 'images', 'latest.jpg');
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).send('Image not found');
  }
});

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(port, () => {
  console.log(`HTTP server is running on http://10.245.93.72:${port}`);
});


*/
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
//added to automatically running image_convert
//const { spawn } = require('child_process'); // <-- Import child_process

const app = express();
const PORT = 3000;

// Middleware to parse raw binary data
app.use(bodyParser.raw({ type: 'application/json', limit: '15mb' })); // Adjust limit as needed

// POST route to receive raw grayscale image data, now async
app.post('/ping', async (req, res) => {
  console.log('Received a POST request at /ping');

  if (!req.body || req.body.length === 0) {
    return res.status(400).json({ message: 'No data received' });
  }

  const filePath = 'received_image.raw';

  try {
    await fs.promises.writeFile(filePath, req.body);
    console.log(`Image saved successfully! Size: ${req.body.length} bytes`);
    res.status(200).json({ message: 'Image received successfully' });
  } catch (err) {
    console.error('Error saving file:', err);
    res.status(500).json({ message: 'Failed to save image' });
  }
});

// Test GET route
app.get('/', (req, res) => {
  res.send('Server is running...');
});

// Start the server
app.listen(PORT, "10.245.93.72", () => {
  console.log(`HTTP server is running on http://10.245.93.72:${PORT}`);
});


/* post request original
//imports express module, for HTTP requests
const express = require('express');
//parse HTTP body ofrequest 
const bodyParser = require('body-parser');

//express app
const app = express();
//server lsitens on port 3000 for incoming requests
const PORT = 3000;

//this attaches json body parser to express app
app.use(bodyParser.json());


//POST route
app.post('/ping', (req, res) => {
  console.log('Received a POST request at /ping from microcontroller!');

  //prints to server console that POST request was recieved. 'req.body' should have a message like "Hello from microcontroller"
  console.log('Body:', req.body);

  //sends HTTP 200 response back saying "Pong!"
  res.status(200).json({ message: 'Pong!' });
});

app.get('/', (req,res) =>{
  console.log('helo');

});
app.listen(PORT, "10.245.93.72", () => {
  console.log(`HTTP server is running on http://10.245.93.72:${PORT}`);
});


*/


























/*



//403 code below


// packages:
const WebSocket = require('ws'); // import WebSocket
const fs = require('fs'); // allows for file reading
const path = require('path');//import path module (handle file paths)

//port number where server will run
const PORT = 8080;

// websocket server listening on port 8080
const wss = new WebSocket.Server({ port: PORT });

// console log the server is running
console.log(`WebSocket server is running on ws://localhost:${PORT}`);

// function that send images to connected client
function sendImageStream(ws, imagesFolder) {
  //this confirms that image folder exists, it doesnt it outputs an error
  if (!fs.existsSync(imagesFolder)) {
    console.error(`Images folder does not exist: ${imagesFolder}`);
    //this will send error message to client then disconnect server
    ws.send(JSON.stringify({ error: 'Images folder does not exist.' }));
    ws.close(); //close server connection
    return;//leave function
  }

  //read through all images in folder and exclude anything thats not .jpg,.jpeg,.png
  let images = fs.readdirSync(imagesFolder).filter(file => { //readdirsync reads conetent from image folder and returns array of file names
    // Only read good files
    return /\.(jpg|jpeg|png)$/i.test(file);
  });

  // if no valid images are found, send error to console
  if (images.length === 0) { 
    console.error('No image files found in:', imagesFolder);
    ws.send(JSON.stringify({ error: 'No images found.' }));
    ws.close();
    return;//exit function
  }

  // Sort images to send them in order, not necessary (remove later)
  images.sort();

  let index = 0;//keep track of current imaage

  //this function takes care of sending images one by one at one second interval
  const sendImage = () => {
    //this restarts loop of images when finished going through all 1000 images (this will be removed in 404)
    if (index >= images.length) {
      index = 0; // restarts image loop
    }

    //this creates the full directory path of current image
    const imagePath = path.join(imagesFolder, images[index]); // path of current image

    //this checks if image actually exists
    if (!fs.existsSync(imagePath)) {
      console.error(`Image file does not exist: ${imagePath}`); //send error message
      index++;
      return sendImage(); //goes to next valid image
    }

    const imageBuffer = fs.readFileSync(imagePath); // read image as binary
    const imageBase64 = imageBuffer.toString('base64'); // binary --> base64 string

    // send image to client as JSON object
    ws.send(JSON.stringify({ image: imageBase64 }));
    index++; // move to next image

    // send next image after 1 second
    ws._timeout = setTimeout(sendImage, 1000);
  };

  // this starts send image function (send image files)
  sendImage();

  
  ws.on('close', () => {
    console.log('Client disconnected');//sends console log that client disconnected
    clearTimeout(ws._timeout); //this stops sending images
  });
}

//handles incomming websocket connections 
wss.on('connection', (ws, req) => {
  const url = req.url; //this gets url of the connection request
  console.log('Client connected to:', url); //logs url to console

  // gets image stream for model 001 or 002
  if (url === '/stream001' || url === '/stream002') {
    // folder path that contains images -->imageFolder
    const imagesFolder = path.join(__dirname, 'images', 'animals', 'images_animals'); // Use your existing images folder
    sendImageStream(ws, imagesFolder);//starts sedning images
  } else {
    // if url doesnt match known stream, output error to website
    console.log('No stream available for this Model ID.');//console error message
    ws.send(JSON.stringify({ message: 'No stream available for this Model ID.' })); //website error messgae
    ws.close();
  }
});

*/