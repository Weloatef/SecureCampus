import cv2
import firebase_admin.auth
from ultralytics import YOLO
import torch
#from model import load_model  # Assuming you have a separate module for loading the model
from ultralytics import YOLO
from pathlib import Path
import numpy as np
import requests
from flask import Flask, render_template, Response, request, redirect, flash, url_for, send_file,current_app,session,jsonify
from flask_mail import Mail, Message
import os 
import firebase_admin
from firebase_admin import credentials, firestore, storage
from werkzeug.utils import secure_filename
from google.cloud import storage as gcs
import six
import logging
from datetime import timedelta
import pytz

cred = credentials.Certificate('./Key.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://databaseName.firebaseio.com',
    'storageBucket': "fir-tofastapi.appspot.com"
})

db = firestore.client()
auth = firebase_admin.auth
bucket = storage.bucket()

app = Flask(__name__)
app.secret_key = b'vR\r\xc2\x831bi\x84\xa7\x1c0\xc0\x90&\x96:\x8f\xbc\x08\xd0@$\x1e'

api_url = "http://127.0.0.1:8000/detectwebcam/"

app.config['MAIL_SERVER']='smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USERNAME'] = 'securecampusproject@gmail.com'
app.config['MAIL_PASSWORD'] = 'ecux byhr dplg nhsy'
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False

mail = Mail(app)

logging.basicConfig(level=logging.DEBUG)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load YOLOv8 model
model = YOLO("yolov8n.pt").to(device)
camera = cv2.VideoCapture(0)  # Open default webcam (index 0)

# Function to delete a folder in Firebase Storage
def delete_folder(bucket, folder_path):
    blobs = bucket.list_blobs(prefix=folder_path)
    for blob in blobs:
        blob.delete()

def generate_frames(detect):
    desired_width = 640
    desired_height = 640
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, desired_width)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, desired_height)

    while True:
        success, frame = camera.read()
        if not success:
            break

        if detect:
            ret, encoded_frame = cv2.imencode('.jpg', frame)
            files = {"file": encoded_frame}
            response = requests.post(api_url, files=files)
            response_frame = response.content
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + response_frame + b'\r\n\r\n')
        else:
            resized_frame = cv2.resize(frame, (440, 440))
            ret, jpeg = cv2.imencode('.jpg', frame)
            frame = jpeg.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n\r\n')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/aboutUs')
def aboutUs():
    return render_template('aboutUs.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'logged_in' not in session:
        if request.method == 'POST':
            id_token = request.form['id_token']

            password = request.form['password']
            try:
                decoded_token = auth.verify_id_token(id_token)
                uid = decoded_token['uid']

                # Check if the email is verified
                user_record = auth.get_user(uid)
                if not user_record.email_verified:
                    return jsonify({'error': 'Your email address has not been verified. Please check your email for the verification link.'}), 403

                # Fetch the user document from Firestore
                user_doc_ref = db.collection('users').document(uid)
                user_doc = user_doc_ref.get()
                if user_doc.exists:
                    user_data = user_doc.to_dict()
                    stored_password = user_data.get('Password', '')

                    # Always update the LastSignIn, regardless of password match
                    user_doc_ref.update({'LastSignIn': firestore.SERVER_TIMESTAMP})

                    if password != stored_password:
                        # Update the password in Firestore
                        user_doc_ref.update({'Password': password})
                        # Additional logic for when the password has changed

                    # User is valid, set the login session
                    session['logged_in'] = True
                    session['user_id'] = uid  # User's ID is stored in 'uid'
                    session['idToken'] = id_token

                    return redirect(url_for('demo'))
                else:
                    flash('User document does not exist.')
            except Exception as e:
                return jsonify({'error': 'Invalid token'}), 400
    else:
        return redirect(url_for('demo'))
    return render_template('login.html')

@app.route('/passwordReset', methods=['GET', 'POST'])
def passwordReset():
    if request.method == 'POST':
        email = request.form.get('email')
        try:
            # Use Firebase Admin SDK to generate a password reset link
            user = auth.get_user_by_email(email)
            link = auth.generate_password_reset_link(email)
            
            # Create the message
            msg = Message("Password Reset Request",
                          sender="securecampusproject@gmail.com",
                          recipients=[email])
            msg.html = f"""<html>
            <head></head>
            <body>
            <p>Hello,</p>

            <p>Follow this link below to reset your SecureCampus password for your {email} account.</p>

            <a href="{link}">RESET YOUR PASSWORD</a>

            <p>If you didn’t ask to reset your password, you can ignore this email.</p>

            <p>Thanks,</p>

            <p>Your SecureCampus team</p>
            </body>
            </html>"""
            
            # Send the email
            mail.send(msg)
            
            return jsonify({'status': 'success', 'message': 'Password reset email sent. Please check your inbox.'})
        except auth.UserNotFoundError:
            return jsonify({'status': 'error', 'message': 'Email not registered. Please check your email or contact us.'}), 400
        except Exception as e:
            # Handle other exceptions
            return jsonify({'status': 'error', 'message': str(e)}), 500
    else:
        return render_template('passwordReset.html')
    
@app.route('/emailVerification', methods=['GET', 'POST'])
def emailVerification():
    if request.method == 'POST':
        email = request.form.get('email')
        try:
            # Use Firebase Admin SDK to generate a email verification link
            user = auth.get_user_by_email(email)
            link = auth.generate_email_verification_link(email)
            # Here, you should send the link to the user's email using your preferred email service provider
            # For example, using Flask-Mail or similar to send the email
            # Create the message
            msg = Message("Email Verification Request",
                            sender="securecampusproject@gmail.com",
                            recipients=[email])
            msg.html = f"""<html>
            <head></head>
            <body>
            <p>Hello,</p>

            <p>Follow this link below to verify your SecureCampus email for your {email} account.</p>

            <a href="{link}">VERIFY YOUR EMAIL</a>

            <p>If you didn’t want to sign up for SecureCampus, you can ignore this email.</p>

            <p>Thanks,</p>

            <p>Your SecureCampus team</p>
            </body>
            </html>"""
            
            # Send the email
            mail.send(msg)
            
            return jsonify({'status': 'success', 'message': 'Email verification link sent. Please check your inbox.'})
        except auth.UserNotFoundError:
            return jsonify({'status': 'error', 'message': 'Email not registered. Please check your email or contact us.'}), 400
        except Exception as e:
            # Handle other exceptions
            return jsonify({'status': 'error', 'message': str(e)}), 500
    else:
        return render_template('emailVerification.html')

@app.route('/demo')
def demo():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    return render_template('demo.html', current_uid=session['user_id'])
    
@app.route('/logout')
def logout():
    uid = session.get('user_id')  # Retrieve user ID from session
    if uid:
        # Check if the user document exists
        users_ref = db.collection('users').document(uid)
        doc = users_ref.get()
        if doc.exists:
            # Update the LastSignOut timestamp in Firestore only if the document exists
            users_ref.update({
                'LastSignOut': firestore.SERVER_TIMESTAMP
            })
    session.clear()  # Clear the session
    return redirect(url_for('login'))

@app.route('/contactUs', methods=['GET', 'POST'])
def contactUs():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        subject = request.form['subject']
        message = request.form['message']
    
        if not name or not email or not message:
            flash('All fields are required!')
            return redirect(url_for('contactUs'))
        
        msg = Message(subject=subject,
                      sender=email,
                      recipients=['securecampusproject@gmail.com'],
                      body=f"Name: {name}\nEmail: {email}\nMessage: {message}")
        mail.send(msg)
        flash('Thank you for your message!')
        return redirect(url_for('contactUs'))
        
    return render_template('contactUs.html')

@app.route('/documentation')
def documentation():
    return render_template('documentation.html')

@app.route('/download')
def downloadFile ():
    #For windows you need to use drive name [ex: F:/Example.pdf]
    path = os.path.join(os.path.curdir,'static/Documentation/SecureCampus Graduation Project Documentation - Senior Project 1.pdf')
    return send_file(path, as_attachment=True)

@app.route('/demoRecordings')
def demoRecordings():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    return render_template('demoRecordings.html', current_uid=session['user_id'])

@app.route('/demoReports')
def demoReports():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    return render_template('demoReports.html', current_uid=session['user_id'])

@app.route('/demoUsers')
def demoUsers():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    return render_template('demoUsers.html', current_uid=session['user_id'])

# Get all users
@app.route('/get_all_users', methods=['GET'])
def get_all_users():
    try:
        users_ref = db.collection('users')
        docs = users_ref.stream()

        users = []
        for doc in docs:
            user = doc.to_dict()
            user['id'] = doc.id  # Add the document id to the user data

            # Adjust LastSignIn and LastSignOut by adding 3 hours and formatting
            for field in ['LastSignIn', 'LastSignOut']:
                if field in user and user[field]:
                    # Firestore timestamp to Python datetime in UTC
                    datetime_obj = user[field].replace(tzinfo=pytz.UTC)
                    # Add 3 hours
                    datetime_obj += timedelta(hours=3)
                    # Format datetime to custom string format with date and time
                    # Example output: "June 21, 2024 at 2:30 PM UTC+3"
                    user[field] = datetime_obj.strftime('%B %d, %Y at %I:%M:%S %p') + " UTC+3"

            users.append(user)

        return jsonify(users), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "An error occurred while fetching users"}), 500

# Delete a user
@app.route('/delete_user/<uid>', methods=['DELETE'])
def delete_user(uid):
    # Delete the user document from Firestore
    db.collection('users').document(uid).delete()
    
    # Delete the user from Firebase Authentication
    try:
        auth.delete_user(uid)
    except auth.UserNotFoundError:
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    # Delete the user's picture from Firebase Storage
    try:
        # Assuming you have a single file in the folder, you need to list the files first
        bucket = storage.bucket()  # Make sure to configure your bucket name if not default
        blobs = bucket.list_blobs(prefix=f'Users/{uid}/')
        for blob in blobs:
            blob.delete()
    except Exception as e:
        return jsonify({'error': 'Failed to delete user picture', 'details': str(e)}), 500

    return jsonify({'message': 'User deleted successfully'}), 200

# Update a user
@app.route('/update_user/<uid>', methods=['POST'])
def update_user(uid):
    try:
        # Step 1: Extract FormData
        email = request.form['Email']
        firstName = request.form['FirstName']
        secondName = request.form['SecondName']
        phoneNumber = request.form['PhoneNumber']
        isAdmin = request.form.get('Admin')  # Use .get() to avoid KeyError if 'Admin' is not provided
        file = request.files.get('file')

        # Step 2: Validate Data (Basic validation)
        if not all([email, firstName, secondName, phoneNumber]):
            return jsonify({'error': 'Missing data'}), 400

        # Step 3: Update Firebase Auth Email
        user = auth.update_user(uid, email=email,email_verified=False)

        # New Step: Send Email Verification Link for the Updated Email
        try:
            link = auth.generate_email_verification_link(email)
            msg = Message("Email Verification Request",
                          sender="securecampusproject@gmail.com",
                          recipients=[email])
            msg.html = f"""<html>
            <head></head>
            <body>
            <p>Hello,</p>

            <p>Follow this link below to verify your email for your {email} account.</p>

            <a href="{link}">VERIFY YOUR EMAIL</a>

            <p>If you didn’t request this, you can ignore this email.</p>

            <p>Thanks,</p>

            <p>Your Team</p>
            </body>
            </html>"""
            mail.send(msg)
        except Exception as e:
            # Log the error or handle it as per your requirement
            print(f"Error sending verification email: {str(e)}")

        # Step 4: Upload New Photo to Firebase Storage (if provided)
        photo_url = None
        if file:
            # Delete existing photo
            # Ensure you have logic here to delete the existing photo if necessary

            # Proceed with file upload
            filename = secure_filename(firstName + ' ' + secondName)
            blob = storage.bucket().blob(f'Users/{uid}/{filename}')
            blob.upload_from_string(
                file.read(),
                content_type=file.content_type
            )
            blob.make_public()
            photo_url = blob.public_url

        # Step 5: Update Firestore Document
        user_data = {
            'FirstName': firstName,
            'SecondName': secondName,
            'PhoneNumber': phoneNumber,
            'Email': email,
        }
        if isAdmin is not None:  # Only add Admin field if isAdmin is not None
            user_data['Admin'] = isAdmin == 'true'
        if photo_url:  # Only add Picture field if photo_url is not None
            user_data['Picture'] = photo_url
        firestore.client().collection('users').document(uid).update(user_data)

        # Step 6: Respond to the Client
        return jsonify({'message': 'User updated successfully. Verification email sent.', 'data': user_data}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add a new user
@app.route('/add_user', methods=['POST'])
def add_user():
    email = request.form['Email']
    password = request.form['Password']
    firstName = request.form['FirstName']
    secondName = request.form['SecondName']
    admin = request.form.get('Admin', 'false').lower() in ('true', '1', 't')

    # Check if email already exists
    try:
        existing_user = auth.get_user_by_email(email)
        # If the above line does not raise an exception, the email exists
        return jsonify({'error': 'Email already exists'}), 400
    except auth.UserNotFoundError:
        # Email does not exist, proceed with creating the user
        pass

    # Create user
    try:
        user_record = auth.create_user(
            email=email,
            password=password,
            email_verified=False  # Initially set to False
        )
        uid = user_record.uid

        # Send verification email
        link = auth.generate_email_verification_link(email)
        # Here, you should send the link to the user's email using your preferred email service provider
        # For example, using Flask-Mail or similar to send the email
        # Create the message
        msg = Message("Email Verification Request",
                        sender="securecampusproject@gmail.com",
                        recipients=[email])
        msg.html = f"""<html>
        <head></head>
        <body>
        <p>Hello,</p>

        <p>Follow this link below to verify your SecureCampus email for your {email} account.</p>

        <a href="{link}">VERIFY YOUR EMAIL</a>

        <p>If you didn’t want to sign up for SecureCampus, you can ignore this email.</p>

        <p>Thanks,</p>

        <p>Your SecureCampus team</p>
        </body>
        </html>"""
        
        # Send the email
        mail.send(msg)

        # Upload image
        file = request.files['file']
        filename = secure_filename(firstName + ' ' + secondName)
        # Assuming 'bucket' is already defined and initialized
        blob = bucket.blob(f'Users/{uid}/{filename}')
        blob.upload_from_string(
            file.read(),
            content_type=file.content_type
        )
        blob.make_public()
        # Use the public URL
        url = blob.public_url

        # Save user info in Firestore
        user_data = request.form.to_dict()
        user_data['Picture'] = url
        user_data['Admin'] = admin  # Save the converted Boolean value
        # Assuming 'db' is already defined and initialized
        db.collection('users').document(uid).set(user_data)

        return jsonify({'message': 'User added, image uploaded, and verification email sent successfully', 'url': url}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/demoAdmin')
def demoAdmin():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    return render_template('demoAdmin.html', current_uid=session['user_id'])

@app.route('/update_password/<uid>', methods=['POST'])
def update_password(uid):
    try:
        # Get the new password from the form data
        new_password = request.form['Password']
        
        # Update the user's password
        user = auth.update_user(
            uid,
            password=new_password
        )
        
        # Optionally, update the password in your Firestore document if needed
        db.collection('users').document(uid).update({'Password': new_password})
        
        return jsonify({'message': 'Password updated successfully'}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': 'Error updating password'}), 500

@app.route('/get_user_data/<uid>', methods=['GET'])
def get_user_data(uid):
    # Get a reference to the Firestore service
    db = firestore.client()

    # Get a reference to the user's document
    doc_ref = db.collection('users').document(uid)

    # Get the document
    doc = doc_ref.get()

    # Check if the document exists
    if doc.exists:
        # Convert the document to a dictionary
        user_data = doc.to_dict()

        for field in ['LastSignIn', 'LastSignOut']:
            if field in user_data and user_data[field]:
                # Firestore timestamp to Python datetime in UTC
                datetime_obj = user_data[field].replace(tzinfo=pytz.UTC)
                # Add 3 hours
                datetime_obj += timedelta(hours=3)
                # Format datetime to custom string format with date and time
                # Example output: "June 21, 2024 at 2:30 PM UTC+3"
                user_data[field] = datetime_obj.strftime('%B %d, %Y at %I:%M %p') + " UTC+3"

        # Return the modified document data as a JSON response
        return jsonify(user_data), 200
    else:
        return jsonify({'error': 'User not found'}), 404

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(detect=False), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/video_feed_with_detection')
def video_feed_with_detection():
    return Response(generate_frames(detect=True), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(debug=True, port=5000)


# api_url = "http://127.0.0.1:8000/detectwebcam/"

# device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# # Load YOLOv8 model
# model = YOLO("yolov8n.pt").to(device)


# def generate_frames():
#     desired_width = 640
#     desired_height = 640
#     camera = cv2.VideoCapture(0)  # Open default webcam (index 0)
#     # Set frame width and height
#     camera.set(cv2.CAP_PROP_FRAME_WIDTH, desired_width)
#     camera.set(cv2.CAP_PROP_FRAME_HEIGHT, desired_height) # 0 for default camera
#     while True:
#         success, frame = camera.read()
#         ret, encoded_frame = cv2.imencode('.jpg', frame)
#         # encoded_frame=encoded_frame.tobytes()
#         if not success:
#             print("nooo")
#             break
#         else:

#             files = {"file": encoded_frame}
#             response = requests.post(api_url, files=files)


        
#             response_frame = response.content
#             #received_frame = cv2.imdecode(np.fromstring(response_frame), cv2.IMREAD_COLOR)
#             yield (b'--frame\r\n'
#                    b'Content-Type: image/jpeg\r\n\r\n' + response_frame + b'\r\n\r\n')
            


#             # Perform object detection
#             # results = model.predict(frame,show=False,save=False) 
#             # frame_with_boxes = results[0].plot()  # YOLOv8 render method returns frames with boxes

#             # # Encode frame as JPEG
#             # ret, jpeg = cv2.imencode('.jpg', frame_with_boxes)
#             # frame_with_boxes = jpeg.tobytes()

            

# @app.route('/')
# def index():
#     return render_template('index.html')


# @app.route('/video_feed')
# def video_feed():
#    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')
# if __name__ == '__main__':
#     app.run(debug=True, port=5000)
