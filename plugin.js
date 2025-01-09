"use strict";

(function () {
    window.OfscPlugin = function () {

        // Initialize the plugin
        this.init = function () {
            try {
                window.addEventListener("message", this._messageListener.bind(this), { passive: true });
                this.sendPostMessageData({
                    apiVersion: 1,
                    method: "ready",
                    sendInitData: true,
                    showHeader: true,
                    enableBackButton: true
                });
            } catch (error) {
                console.error("Error initializing plugin:", error);
            }
        };

        // Send post message to the parent system
        this.sendPostMessageData = function (data) {
            try {
                const targetOrigin = "https://atni1.test.fs.ocs.oraclecloud.com"; // Parent page origin
                const currentOrigin = window.location.origin;

                // Allow any origin during local development
                const allowedOrigins = ["null", "http://localhost:8000"];
                const target = allowedOrigins.includes(currentOrigin) ? "*" : targetOrigin;

                parent.postMessage(JSON.stringify(data), target);
                // Console log has been removed to keep it hidden from the console
            } catch (error) {
                console.error("Error sending post message data:", error);
            }
        };

        // Open the activity data and update the UI
        this.open = function (data) {
            try {
                const fields = [
                    { id: "feedback_comments", value: data.activity?.feedback_comments || "" },
                    { id: "feedback_rating", value: data.activity?.feedback_rating || "" }
                ];

                // Set values for the fields
                fields.forEach(field => {
                    const element = document.getElementById(field.id);
                    if (element) {
                        if (field.id === "feedback_rating") {
                            this._setStarRating(field.value); // Set the star rating
                        } else {
                            element.value = field.value; // Set the text for comments
                        }
                    } else {
                        console.warn(`Element with ID ${field.id} not found.`);
                    }
                });

                // Initialize the star rating system
                this._addStarRatingListeners();

                // Add event listeners for the submit button
                this._addSubmitButtonListener();
            } catch (e) {
                console.error("Error processing activity data:", e);
            }
        };

        // Set the initial star rating (if a value is passed)
        this._setStarRating = function (ratingValue) {
            const stars = document.querySelectorAll('.star');
            stars.forEach(function (star) {
                star.style.color = star.getAttribute('data-value') <= ratingValue ? '#ffbb33' : '#dcdcdc';
            });
        };

        // Add event listeners for star rating
        this._addStarRatingListeners = function () {
            const stars = document.querySelectorAll('.star');
            stars.forEach(function (star) {
                star.addEventListener('click', function () {
                    const selectedRating = this.getAttribute('data-value');
                    document.getElementById('rating-value').value = selectedRating;
                    stars.forEach(function (star) {
                        star.style.color = star.getAttribute('data-value') <= selectedRating ? '#ffbb33' : '#dcdcdc';
                    });
                });
            });
        };

        // Add event listeners for the submit button
        this._addSubmitButtonListener = function () {
            const submitButton = document.getElementById("submitfeedback");
            if (submitButton) {
                submitButton.addEventListener("click", () => {
                    console.log("Submit button clicked");  // Debugging log
                    this.submitData();  // Call submitData on button click
                });
            } else {
                console.warn("Submit button with id 'submitfeedback' not found.");
            }
        };

        // Submit data
        this.submitData = function () {
            const commentElement = document.getElementById("feedback_comments");
            const ratingElement = document.getElementById("rating-value");

            if (commentElement && ratingElement) {
                const comment = commentElement.value.trim();
                const rating = ratingElement.value.trim();

                // Check if both rating and comment are provided
                if (!comment || !rating) {
                    alert("Please enter both a comment and a rating before submitting.");
                    return;  // Prevent submission
                }

                try {
                    // Send the feedback data to the parent system
                    this.sendPostMessageData({
                        apiVersion: 1,
                        method: "update",
                        activity: {
                            feedback_comments: comment,
                            feedback_rating: rating  // Send the selected rating
                        }
                    });

                    console.log("Data submitted successfully:", comment, rating);

                    // Show Thank You message and hide form elements
                    this.showThankYouMessage();

                    // Save the data in local storage (optional)
                    this.saveFeedbackLocally(comment, rating);

                } catch (e) {
                    console.error("Error submitting data:", e);
                    alert("An error occurred while submitting feedback. Please try again.");
                }
            } else {
                console.error("Required elements not found.");
                alert("Missing required elements. Please try again.");
            }
        };

        // Show Thank You message and disable the form
        this.showThankYouMessage = function () {
            // Hide the feedback form elements
            const feedbackSection = document.querySelector('.feedback-section');
            const submitButton = document.getElementById('submitfeedback');
            const header = document.querySelector('header');
            
            if (feedbackSection) {
                feedbackSection.style.display = 'none';
            }
            if (submitButton) {
                submitButton.style.display = 'none';
            }
            if (header) {
                header.style.display = 'none';
            }

            // Show a Thank You message
            const thankYouMessage = document.querySelector('.thank-you-message');
            if (thankYouMessage) {
                thankYouMessage.classList.add('show');
            } else {
                const newMessage = document.createElement('div');
                newMessage.className = 'thank-you-message show';
                newMessage.innerHTML = "<h2>Thank You for Your Feedback!</h2><p>Your feedback has been successfully submitted.</p>";
                document.body.appendChild(newMessage);
            }

            // Optionally disable the "Clear" button if needed
            const clearButton = document.getElementById("clearFeedback");
            if (clearButton) {
                clearButton.disabled = true;
            }
        };

        // Save the feedback data locally
        this.saveFeedbackLocally = function (comment, rating) {
            const feedbackData = {
                comment: comment,
                rating: rating,
                submittedAt: new Date().toISOString()
            };

            localStorage.setItem('feedbackData', JSON.stringify(feedbackData));
            console.log("Feedback data saved locally:", feedbackData);
        };

        // Message listener to handle responses from the parent system
        this._messageListener = function (event) {
            try {
                let data;

                // Check if event.data is an object or a string
                if (typeof event.data === 'string') {
                    try {
                        data = JSON.parse(event.data);
                    } catch (e) {
                        console.warn("Received data is not valid JSON:", event.data);
                        return;
                    }
                } else if (typeof event.data === 'object') {
                    data = event.data;
                } else {
                    console.warn('Received data is neither an object nor a string:', event.data);
                    return;
                }

                // Ensure message is coming from a trusted origin
                const trustedOrigins = ["https://atni1.test.fs.ocs.oraclecloud.com", "http://localhost:8000"];

                if (!trustedOrigins.includes(event.origin)) {
                    console.warn('Message received from untrusted origin:', event.origin);
                    return;
                }
/*
                if (data.method === "error") {
                    // Handle error message from parent
                    if (data.error) {
                        console.error("Error received from parent:", data.error);
                        alert("Error: " + data.error);
                    } else {
                        console.error("Error received from parent with no details.");
                        alert("An error occurred. Please try again.");
                    }
                    return;
                }*/

                switch (data.method) {
                    case "init":
                        localStorage.setItem("simplePlugin", JSON.stringify(data.attributeDescription));
                        this.sendPostMessageData({ apiVersion: 1, method: "initEnd" });
                        break;
                    case "open":
                        this.open(data);
                        break;
                    case "updateResult":
                        console.log("Update successful!");
                        break;
                    case "close":
                        this.sendPostMessageData({ apiVersion: 1, method: "close" });
                        break;
                        /*
                    default:
                        console.log("Unknown method:", data.method);
                        */
                }
            } catch (error) {
                console.error("Error handling message:", error);
            }
        };
    };

    // Initialize the plugin when the page loads
    window.addEventListener("load", function () {
        const plugin = new OfscPlugin();
        plugin.init();
    });

})();
