from flask import Flask, request
from flask_socketio import SocketIO, emit
from deepface import DeepFace
import cv2
import tensorflow as tf
import os
import threading
from PIL import Image
import io
import base64
import numpy as np

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow CORS

# Rest of your code...

# Ensure that you have OpenCV built with CUDA
if not cv2.cuda.getCudaEnabledDeviceCount():
    print("OpenCV was not built with CUDA enabled. Build it from source with CUDA.")
    exit()

# Set the device to the first GPU
cv2.cuda.setDevice(0)

with tf.device('/GPU:0'):
    # Load pre-trained VGG-Face model
    model = DeepFace.build_model("VGG-Face")

    # Load OpenCV's Haar Cascade for face detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    images_dir = "C:\\Users\\walid\\Downloads\\images"

    @socketio.on('frame')
    def handle_frame(data):
        # Remove the 'data:image/jpeg;base64,' part
        base64_image = data.split(',', 1)[1]

        # Convert the base64 string to bytes
        image_bytes = base64.b64decode(base64_image)

        # Open the image
        image = Image.open(io.BytesIO(image_bytes))

        # Convert the image to a numpy array and process it
        frame = np.array(image)
        start_face_recognition(frame)

    def verify_face(detected_face, x, y, w, h, frame):
        for filename in os.listdir(images_dir):
            if filename.endswith(".jpg") or filename.endswith(".png"): 
                # Construct the full path to the image
                image_path = os.path.join(images_dir, filename)
                try:
                    result = DeepFace.verify(detected_face, image_path, model_name="VGG-Face", enforce_detection=False)
                except cv2.error:
                    print(f"An error occurred while processing the image {image_path}. Skipping this image.")
                    continue

                # Display the result
                if result["verified"]:
                    file_name = os.path.basename(image_path)

                    # Store the file name in a string variable
                    file_name_string = str(file_name)
                    print(file_name_string)
                    socketio.emit('face_verified', {'x': x, 'y': y, 'w': w, 'h': h, 'file_name': file_name_string})

                    # Draw a green rectangle around the face with the file name written
                    cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                    cv2.putText(frame, file_name_string, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    def start_face_recognition(frame):
        # Convert the frame to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Detect faces in the frame
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

        for (x, y, w, h) in faces:
            # Extract the face from the frame
            detected_face = frame[y:y+h, x:x+w]

            # Draw a red rectangle around the face with "Unknown" written
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
            cv2.putText(frame, "Unknown", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
            socketio.emit('face_detected', {'x': x, 'y': y, 'w': w, 'h': h})

            # Start a new thread to verify the face
            threading.Thread(target=verify_face, args=(detected_face, x, y, w, h, frame)).start()


#Members API Route
@app.route('/members')
def members():
    return {'members': ['Alice', 'Bob', 'Charlie']}

if __name__ == '__main__':
    socketio.run(app, debug=True)