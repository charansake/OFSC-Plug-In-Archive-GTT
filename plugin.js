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

                // Check if feedback has been submitted on page load
                this._checkFeedbackStatus();
            } catch (error) {
                console.error("Error initializing plugin:", error);
            }
        };

        // Check feedback submission status from localStorage
        this._checkFeedbackStatus = function () {
            const aid = document.getElementById("aid")?.value; // Get the current aid
            if (aid) {
                const isFeedbackSubmitted = localStorage.getItem('feedbackSubmittedForAid_' + aid);
                if (isFeedbackSubmitted) {
                    this.showThankYouMessage();
                    this._disableClearButton();  // Disable or hide the "Clear" button
                    this._disableHeaderAndForm();   // Hide the header and form
                } else {
                    // Ensure header and feedback form are visible if feedback hasn't been submitted
                    this._showFeedbackForm();
                }
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
            } catch (error) {
                console.error("Error sending post message data:", error);
            }
        };

        // Open the activity data and update the UI
        this.open = function (data) {
            try {
                const fields = [
                    { id: "aid", value: data.activity?.aid || "12" },
                    { id: "feedback_comments", value: data.activity?.feedback_comments || "" },
                    { id: "feedback_rating", value: data.activity?.feedback_rating || "" }
                ];

                // Check if feedback for this `aid` has been submitted
                const isFeedbackSubmitted = localStorage.getItem('feedbackSubmittedForAid_' + data.activity?.aid);
                if (isFeedbackSubmitted) {
                    this.showThankYouMessage();
                    this._disableClearButton();  // Disable or hide the "Clear" button
                    this._disableHeaderAndForm();   // Hide the header and form
                    return;
                }

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

                this._addStarRatingListeners();
                this._addSubmitButtonListener();
                this._addClearButtonListener(); // Add listener for the clear button
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
                    console.log("Submit button clicked");
                    this.submitData();
                });
            } else {
                console.warn("Submit button with id 'submitfeedback' not found.");
            }
        };

        // Add event listeners for the clear button
        this._addClearButtonListener = function () {
            const clearButton = document.getElementById("clearFeedback");
            if (clearButton) {
                clearButton.addEventListener("click", () => {
                    console.log("Clear button clicked");
                    this.clearForm();
                });
            } else {
                console.warn("Clear button with id 'clearFeedback' not found.");
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
                    return;
                }

                try {
                    const aid = document.getElementById("aid").value;

                    // Send the feedback data to the parent system
                    this.sendPostMessageData({
                        apiVersion: 1,
                        method: "update",
                        activity: {
                            aid: aid,
                            feedback_comments: comment,
                            feedback_rating: rating
                        }
                    });

                    console.log("Data submitted successfully:", comment, rating);

                    // Mark feedback as submitted for this aid
                    localStorage.setItem('feedbackSubmittedForAid_' + aid, true);

                    this.showThankYouMessage();
                    this._disableClearButton();  // Disable or hide the "Clear" button
                    this._disableHeaderAndForm();   // Hide the header and form after submission

                } catch (e) {
                    console.error("Error submitting data:", e);
                    alert("An error occurred while submitting feedback. Please try again.");
                }
            } else {
                console.error("Required elements not found.");
                alert("Missing required elements. Please try again.");
            }
        };

        // Disable or hide the "Clear" button after submission
        this._disableClearButton = function () {
            const clearButton = document.getElementById("clearFeedback");
            if (clearButton) {
                clearButton.disabled = true; // Disable the button
                clearButton.style.display = 'none'; // Hide the button
            }
        };

        // Show Thank You message and disable the form
        this.showThankYouMessage = function () {
            // Hide feedback form elements
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
                header.style.display = 'none'; // Hide the header
            }

            const thankYouMessage = document.querySelector('.thank-you-message');
            if (thankYouMessage) {
                thankYouMessage.classList.add('show');
            } else {
                const newMessage = document.createElement('div');
                newMessage.className = 'thank-you-message show';
                newMessage.innerHTML = "<h2>Thank You for Your Feedback!</h2><p>Your feedback has been successfully submitted.</p>";
                document.body.appendChild(newMessage);
            }
        };

        // Clear the feedback form
        this.clearForm = function () {
            document.getElementById('feedback_comments').value = '';
            document.getElementById('rating-value').value = '';
            this._setStarRating(0); // Reset the star rating to zero
        };

        // Ensure header and form are shown if feedback has not been submitted
        this._showFeedbackForm = function () {
            const header = document.querySelector('header');
            if (header) {
                header.style.display = 'block';  // Ensure header is visible
            }

            const feedbackSection = document.querySelector('.feedback-section');
            if (feedbackSection) {
                feedbackSection.style.display = 'block';  // Ensure feedback form is visible
            }
        };

        // Hide header and feedback form after submission
        this._disableHeaderAndForm = function () {
            const header = document.querySelector('header');
            if (header) {
                header.style.display = 'none';  // Hide the header
            }

            const feedbackSection = document.querySelector('.feedback-section');
            if (feedbackSection) {
                feedbackSection.style.display = 'none';  // Hide the feedback form
            }
        };

        // Message listener to handle responses from the parent system
        this._messageListener = function (event) {
            try {
                let data;

                // Parse the event data safely
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
                    default:
                        console.log("Unknown method:", data.method);
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
