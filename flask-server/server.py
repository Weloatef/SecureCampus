from flask import Flask
from deepface import DeepFace
import cv2
import tensorflow as tf
import os

# with tf.device('/GPU:0'):
# Load pre-trained VGG-Face model
#  model = DeepFace.build_model("VGG-Face")

#  # Load OpenCV's Haar Cascade for face detection
#  face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

#  # Capture video from your webcam (change the index if you have multiple cameras)
#  cap = cv2.VideoCapture(0)
#  images_dir = "C:\\Users\\pc\\Desktop\\source code\\images\\"

#  while True:
#     # Read a frame from the webcam
#      ret, frame = cap.read()

#     # Convert the frame to grayscale for face detection
#      gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

#     # Detect faces in the frame
#      faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

#      for (x, y, w, h) in faces:
#         # Extract the face from the frame
#          detected_face = frame[y:y+h, x:x+w]
#          cv2.imwrite('temp_face.jpg', detected_face)
         
         
#          for filename in os.listdir(images_dir):
#            if filename.endswith(".jpg") or filename.endswith(".png"): 
#               # Construct the full path to the image
#               image_path = os.path.join(images_dir, filename)
#               result = DeepFace.verify(detected_face, image_path, model_name="VGG-Face", enforce_detection=False)
#         # Perform face recognition using DeepFace
#            #result = DeepFace.verify(detected_face,image_path , model_name="VGG-Face", enforce_detection=False)

#         # Display the result
#               if result["verified"]:
#                 file_name = os.path.basename(image_path)

#            # Store the file name in a string variable
#                 file_name_string = str(file_name)
#                 print(file_name_string)
#                 cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
#                 cv2.putText(frame, f"Person: {file_name}", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
#               #else:
#                   #cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
#                   #cv2.putText(frame, "Facce", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

#     # Display the frame
#      cv2.imshow('Face Recognition', frame)
#      #cv2.imshow('Face Recognition', detected_face)

#     # Break the loop when 'q' key is pressed
#      if cv2.waitKey(1) & 0xFF == ord('q'):
#         break

# # Release the webcam and close the OpenCV window
#  cap.release()
#  cv2.destroyAllWindows()

app = Flask(__name__)

#Members API Route
@app.route('/members')
def members():
    return {'members': ['Alice', 'Bob', 'Charlie']}

if __name__ == '__main__':
    app.run(debug=True)