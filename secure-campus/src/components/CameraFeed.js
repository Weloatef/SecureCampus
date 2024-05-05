import React, { useRef, useEffect } from 'react';
import './CameraFeed.css';

function CameraFeed() {
    const videoRef = useRef(null);

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
    }, []);

    return (
        <section id="camera-feed">
            <div className="camera-container">
                <video ref={videoRef} width="720" height="560" autoPlay muted></video>
            </div>
        </section>
    );
}

export default CameraFeed;