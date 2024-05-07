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

        socketRef.current = io.connect('/', {
            'reconnection': true,
            'reconnectionDelay': 1000,
            'reconnectionDelayMax' : 5000,
            'reconnectionAttempts': 5
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('Connection error:', error);
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
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    const drawBox = (data, color, label) => {
        if (!data || !data.x || !data.y || !data.w || !data.h) {
            console.error('Invalid data:', data);
            return;
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
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