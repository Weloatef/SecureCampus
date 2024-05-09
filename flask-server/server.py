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

# Create a Flask application
app = Flask(__name__)
# Create a SocketIO server and allow Cross-Origin Resource Sharing (CORS)
socketio = SocketIO(app, cors_allowed_origins="*")

# Check if OpenCV was built with CUDA enabled
if not cv2.cuda.getCudaEnabledDeviceCount():
    print("OpenCV was not built with CUDA enabled. Build it from source with CUDA.")
    exit()

# Set the device to the first GPU
cv2.cuda.setDevice(0)

# Use the first GPU for TensorFlow operations
with tf.device('/GPU:0'):
    # Load pre-trained VGG-Face model for face recognition
    model = DeepFace.build_model("VGG-Face")

    # Load OpenCV's Haar Cascade for face detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    # Directory containing face images for verification
    images_dir = "C:\\Users\\walid\\Downloads\\images"

    # Handle 'frame' events from the client
    @socketio.on('frame')
    def handle_frame(data):
        # Remove the 'data:image/jpeg;base64,' part from the incoming data
        base64_image = data.split(',', 1)[1]

        # Convert the base64 string to bytes
        image_bytes = base64.b64decode(base64_image)

        # Open the image
        image = Image.open(io.BytesIO(image_bytes))

        # Convert the image to a numpy array and process it
        frame = np.array(image)

        # Store the original frame dimensions
        original_height, original_width = frame.shape[:2]

        # Resize the frame to a lower resolution for faster processing
        frame = resize_image(frame, (1024, 768))

        # Convert the frame to float32 for TensorFlow operations
        frame = frame.astype(np.float32)

        # Start face recognition on the frame
        start_face_recognition(frame, original_width, original_height)

    # Resize an image to a specified size
    def resize_image(image, size):
        return cv2.resize(image, size)

    # Verify a detected face against the images in the images directory
    def verify_face(detected_face, x, y, w, h, frame):
        try:
            if detected_face is None or detected_face.size == 0:
                print("No face detected")
                return

            for filename in os.listdir(images_dir):
                if filename.endswith(".jpg") or filename.endswith(".png"): 
                    # Construct the full path to the image
                    image_path = os.path.join(images_dir, filename)
                    print(f"Processing image: {image_path}")

                    # Resize the detected face to match the input size of the VGG-Face model
                    detected_face = resize_image(detected_face, (224, 224)) 
                    print("Image resized")

                    # Verify the detected face against the current image
                    result = DeepFace.verify(detected_face, image_path, model_name="VGG-Face", enforce_detection=False)
                    print("Verification completed")

                    # If the face is verified, emit a 'face_verified' event to the client
                    if result["verified"]:
                        file_name = os.path.basename(image_path)

                        # Store the file name in a string variable
                        file_name_string = str(file_name)
                        print(file_name_string)
                        emit('face_verified', {'x': int(x.item()), 'y': int(y.item()), 'w': int(w.item()), 'h': int(h.item()), 'file_name': file_name_string})

                        # Draw a green rectangle around the face with the file name written
                        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                        cv2.putText(frame, file_name_string, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        except Exception as e:
            print(f"Error in verify_face: {e}")

    # Start face recognition on a frame
    def start_face_recognition(frame, original_width, original_height):
        try:
            # Convert the frame to grayscale for face detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            # Convert the grayscale frame back to 8-bit unsigned integers for OpenCV operations
            gray = gray.astype(np.uint8)

            # Detect faces in the frame
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

            for (x, y, w, h) in faces:
                # Scale the coordinates back to the original resolution
                x = int(x * original_width / 1024)
                y = int(y * original_height / 768)
                w = int(w * original_width / 1024)
                h = int(h * original_height / 768)

                # Extract the face from the frame
                detected_face = frame[y:y+h, x:x+w]

                # Draw a red rectangle around the face with "Unknown" written
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
                cv2.putText(frame, "Unknown", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                
                # Emit the face_detected event with the coordinates converted to int
                socketio.emit('face_detected', {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)})

                # Start a new thread to verify the face
                threading.Thread(target=verify_face, args=(detected_face, x, y, w, h, frame)).start()
        except Exception as e:
            print(f"Error in start_face_recognition: {e}")

# Route for getting the list of members
@app.route('/members')
def members():
    return {'members': ['Alice', 'Bob', 'Charlie']}

# Main route
@app.route('/')
def index():
    return '''
    <!DOCTYPE html>
    <html>
    <body>
        <video id="video" width="720" height="560" autoplay muted></video>
        <canvas id="canvas" width="720" height="560"></canvas>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.min.js"></script>
        <script>
            const video = document.getElementById('video');
            const canvas = document.getElementById('canvas');
            const context = canvas.getContext('2d');
            const socket = io.connect(location.origin);

            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    video.srcObject = stream;
                });

            socket.on('face_detected', data => {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.beginPath();
                context.rect(data.x, data.y, data.w, data.h);
                context.lineWidth = 2;
                context.strokeStyle = 'red';
                context.fillStyle = 'red';
                context.stroke();
                context.fillText('Unknown', data.x, data.y > 20 ? data.y - 5 : data.y + 10);
            });

            socket.on('face_verified', data => {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.beginPath();
                context.rect(data.x, data.y, data.w, data.h);
                context.lineWidth = 2;
                context.strokeStyle = 'green';
                context.fillStyle = 'green';
                context.stroke();
                context.fillText(data.file_name, data.x, data.y > 20 ? data.y - 5 : data.y + 10);
            });

            setInterval(() => {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    let data = canvas.toDataURL('image/jpeg');
                    socket.emit('frame', data);
                }
            }, 100);
        </script>
    </body>
    </html>
    '''

# Start the server
if __name__ == '__main__':
    socketio.run(app, debug=True)