import React, { useRef, useEffect } from 'react';
import io from 'socket.io-client';
import './CameraFeed.css';

function CameraFeed() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const socketRef = useRef();

    useEffect(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(error => {
                    console.error('Error accessing the camera:', error);
                });
        } else {
            console.error('getUserMedia is not supported');
        }

        socketRef.current = io.connect('/'); // Connect to the server

        socketRef.current.on('face_detected', data => {
            console.log(data);
            drawBox(data, 'red', 'Unknown');
        });

        socketRef.current.on('face_verified', data => {
            console.log(data);
            drawBox(data, 'green', data.file_name);
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    const drawBox = (data, color, label) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
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
                <video ref={videoRef} width="720" height="560" autoPlay muted></video>
                <canvas ref={canvasRef} width="720" height="560"></canvas>
            </div>
        </section>
    );
}

export default CameraFeed;