import numpy as np
from PIL import Image

width, height = 160, 120

with open("received_image.raw", "rb") as f:
    raw_data = f.read()

# Create a NumPy array from the raw bytes
img_array = np.frombuffer(raw_data, dtype=np.uint8).reshape((height, width))

# Convert to a Pillow Image (mode "L" = 8-bit grayscale)
img = Image.fromarray(img_array, mode="L")

# Save or show the image
img.save("output.png")
img.show()
