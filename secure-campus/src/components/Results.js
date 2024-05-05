import React from 'react';
import './Results.css';

function Results() {
    const openResult = (event, tabName) => {
        // Get all tab content elements
        const tabContents = document.getElementsByClassName("tabcontent");

        // Hide all tab content elements
        for (let i = 0; i < tabContents.length; i++) {
            tabContents[i].style.display = "none";
        }

        // Show the selected tab content
        const selectedTabContent = document.getElementById(tabName);
        if (selectedTabContent) {
            selectedTabContent.style.display = "block";
        }
    };

    return (
        <section id="detection-results">
            <div className="container">
                <h2>Detection Results</h2>
                <div className="tab">
                    <button className="tablinks" onClick={(event) => openResult(event, 'Face')}>Face Recognition</button>
                    <button className="tablinks" onClick={(event) => openResult(event, 'Behaviour')}>Behaviour Detection</button>
                    <button className="tablinks" onClick={(event) => openResult(event, 'Clothes')}>Clothes Detection</button>
                </div>

                <div id="Face" className="tabcontent">
                    <h3>Face Recognition</h3>
                    <div className="result-container">
                        <p id="face-recognition-results">Results...</p>
                    </div>
                </div>

                <div id="Behaviour" className="tabcontent">
                    <h3>Behaviour Detection</h3>
                    <div className="result-container">
                        <p id="behaviour-detection-results">Results...</p>
                    </div>
                </div>

                <div id="Clothes" className="tabcontent">
                    <h3>Clothes Detection</h3>
                    <div className="result-container">
                        <p id="clothes-detection-results">Results...</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Results;