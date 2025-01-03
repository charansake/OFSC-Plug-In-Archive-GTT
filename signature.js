"use strict";

// Function to save the signature from the canvas
function signatureSave() {
    const canvas = document.getElementById('gtt_engineer_signature');
    if (canvas) {
        const dataURL = canvas.toDataURL('image/png');
        document.getElementById('SFA_FSR_CUS').src = dataURL;
    } else {
        console.error("Canvas element not found");
    }
}

// Function to clear the signature from the canvas
function signatureClear() {
    const canvas = document.getElementById('gtt_engineer_signature');
    if (canvas) {
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
    } else {
        console.error("Canvas element not found");
    }
}

// Function to capture the signature on the canvas
function signatureCapture() {
    const canvas = document.getElementById('gtt_engineer_signature');
    if (canvas) {
        const context = canvas.getContext('2d');
        let painting = false;

        function getMousePos(event) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        }

        canvas.addEventListener('mousedown', (event) => {
            painting = true;
            const pos = getMousePos(event);
            context.beginPath();
            context.moveTo(pos.x, pos.y);
        });

        canvas.addEventListener('mousemove', (event) => {
            if (painting) {
                const pos = getMousePos(event);
                context.lineTo(pos.x, pos.y);
                context.stroke();
            }
        });

        canvas.addEventListener('mouseup', () => {
            painting = false;
        });

        canvas.addEventListener('mouseleave', () => {
            painting = false;
        });

        // Handle touch events for mobile devices
        canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            painting = true;
            const pos = getMousePos(event.touches[0]);
            context.beginPath();
            context.moveTo(pos.x, pos.y);
        });

        canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            if (painting) {
                const pos = getMousePos(event.touches[0]);
                context.lineTo(pos.x, pos.y);
                context.stroke();
            }
        }, { passive: true }); // Mark the touchmove event listener as passive

        canvas.addEventListener('touchend', () => {
            painting = false;
        });

        canvas.addEventListener('touchcancel', () => {
            painting = false;
        });
    } else {
        console.error("Canvas element not found");
    }
}

// Initialize the signature capture functionality
document.addEventListener('DOMContentLoaded', (event) => {
    signatureCapture();
});
