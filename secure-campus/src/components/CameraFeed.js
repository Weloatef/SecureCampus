import React, { useRef, useEffect } from 'react';
import io from 'socket.io-client';
import './CameraFeed.css';

function CameraFeed() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const socketRef = useRef();
    let timeoutId = null;

    useEffect(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        console.log('Video stream received:', stream);

                        // Wait for the video to be loaded
                        videoRef.current.onloadedmetadata = () => {
                            // Set the canvas's width and height to match the video's actual resolution
                            canvasRef.current.width = videoRef.current.videoWidth;
                            canvasRef.current.height = videoRef.current.videoHeight;
                        };
                    }
                })
                .catch(error => {
                    console.error('Error accessing the camera:', error);
                });
        } else {
            console.error('getUserMedia is not supported');
        }

        socketRef.current = io.connect('/', {
            'reconnection': true,
            'reconnectionDelay': 1000,
            'reconnectionDelayMax' : 5000,
            'reconnectionAttempts': 5
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('Connection error:', error);
            clearCanvas();
        });

        socketRef.current.on('reconnect_failed', () => {
            console.error('Failed to reconnect');
        });

        socketRef.current.on('face_detected', data => {
            console.log('Received face_detected event with data:', data);
            drawBox(data, 'red', 'Unknown');
        });

        socketRef.current.on('face_verified', data => {
            console.log('Received face_verified event with data:', data);
            drawBox(data, 'green', data.file_name);

            // Set a timeout to clear the box after 3 seconds
            timeoutId = setTimeout(() => {
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);
            }, 3000);
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
    };

    const drawBox = (data, color, label) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
    
        if (!data || !data.x || !data.y || !data.w || !data.h) {
            console.error('Invalid data:', data);
            return;
        }
    
        // Clear the canvas only when new data is received
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.beginPath();
        context.rect(data.x, data.y, data.w, data.h);
        context.lineWidth = 2;
        context.strokeStyle = color;
        context.fillStyle = color;
        context.stroke();
        context.fillText(label, data.x, data.y > 20 ? data.y - 5 : data.y + 10);
    };

    return (
        <section id="camera-feed">
            <div className="camera-container">
                <video ref={videoRef} autoPlay muted></video>
                <canvas ref={canvasRef}></canvas>
            </div>
        </section>
    );
}

export default CameraFeed;