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

