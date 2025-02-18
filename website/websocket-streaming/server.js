
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = 3000;


app.use(bodyParser.raw({ type: 'application/json', limit: '15mb' })); // Adjust limit as needed


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


app.get('/', (req, res) => {
  res.send('Server is running...');
});


app.listen(PORT, "10.245.93.72", () => {
  console.log(`HTTP server is running on http://10.245.93.72:${PORT}`);
});

