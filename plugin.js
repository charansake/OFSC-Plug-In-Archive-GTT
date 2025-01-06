"use strict";

(function () {
    window.OfscPlugin = function () {

        // Initialize the plugin
        this.init = function () {
            window.addEventListener("message", this._messageListener.bind(this), { passive: true });
            this.sendPostMessageData({
                apiVersion: 1,
                method: "ready",
                sendInitData: true,
                showHeader: true,
                enableBackButton: true
            });
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
                console.log("Message sent to parent:", data);
            } catch (error) {
                console.error("Error sending post message data:", error);
            }
        };

        // Open the activity data and update the UI
        this.open = function (data) {
            try {
                // Populate the technician comments and rating if available
                const fields = [
                    { id: "gtt_technician_comments", value: data.activity?.gtt_technician_comments || "" },
                    { id: "rating-value", value: data.activity?.gtt_technician_rating || "" }
                ];

                fields.forEach(field => {
                    const element = document.getElementById(field.id);
                    if (element) {
                        element.value = field.value;  // Set the initial technician comment and rating
                    } else {
                        console.warn(`Element with ID ${field.id} not found.`);
                    }
                });

                // Initialize the star rating system
                this._initializeStarRating();

                // Add event listeners for submit and clear buttons
                this._addButtonListeners(data);
            } catch (e) {
                console.error("Error processing activity data:", e);
            }
        };

        // Initialize the star rating system and handle user interactions
        this._initializeStarRating = function () {
            const stars = document.querySelectorAll('.star');
            const ratingInput = document.getElementById('rating-value');
            const selectedRating = ratingInput.value;

            stars.forEach(function (star) {
                star.addEventListener('click', function () {
                    const selectedRating = this.getAttribute('data-value');
                    ratingInput.value = selectedRating;

                    stars.forEach(function (star) {
                        star.style.color = star.getAttribute('data-value') <= selectedRating ? '#ffbb33' : '#dcdcdc';
                    });
                });
            });

            // Set the rating stars' color based on the initial rating value (if any)
            stars.forEach(function (star) {
                if (star.getAttribute('data-value') <= selectedRating) {
                    star.style.color = '#ffbb33'; // Set the stars that are already rated
                }
            });
        };

        // Add event listeners for submit and clear buttons
        this._addButtonListeners = function (data) {
            const submitButton = document.getElementById("submitFeedback");
            if (submitButton) {
                submitButton.addEventListener("click", () => this.submitData(data), { passive: true });
            } else {
                console.warn("Submit button not found.");
            }

            const clearButton = document.getElementById("clearFeedback");
            if (clearButton) {
                clearButton.addEventListener("click", () => this.clearFeedback(), { passive: true });
            } else {
                console.warn("Clear button not found.");
            }

            const dismissButton = document.getElementById("Dismiss");
            if (dismissButton) {
                dismissButton.addEventListener("click", () => this.sendPostMessageData({ apiVersion: 1, method: "close" }), { passive: true });
            } else {
                console.warn("Dismiss button not found.");
            }
        };

        // Submit feedback data
        this.submitData = function (data) {
            const commentElement = document.getElementById("gtt_technician_comments");
            const ratingElement = document.getElementById("rating-value");

            if (commentElement) {
                const comment = commentElement.value.trim();
                const rating = ratingElement.value.trim();

                if (comment && rating) {
                    try {
                        this.sendPostMessageData({
                            apiVersion: 1,
                            method: "update",
                            activity: {
                                ...data.activity,
                                gtt_technician_comments: comment,
                                gtt_technician_rating: rating
                            }
                        });

                        console.log("Data submitted successfully:", data.activity);

                        alert("Form submitted successfully!");
                        window.history.back(); // Go back to the previous page
                    } catch (e) {
                        console.error("Error submitting data:", e);
                    }
                } else {
                    alert("Please enter both a comment and a rating before submitting.");
                }
            } else {
                console.error("Element with ID 'gtt_technician_comments' not found");
            }
        };

        // Clear the feedback form
        this.clearFeedback = function () {
            document.getElementById("gtt_technician_comments").value = ''; // Clear feedback comments
            document.getElementById("rating-value").value = ''; // Clear rating value

            // Reset the star colors
            const stars = document.querySelectorAll('.star');
            stars.forEach(function (star) {
                star.style.color = '#dcdcdc'; // Reset stars color to default
            });
        };

        // Message listener to handle responses from the parent system
        this._messageListener = function (event) {
            try {
                const data = JSON.parse(event.data);
                if (data.method === "error") {
                    console.error("Error received from parent:", JSON.stringify(data.error || "No error details available"));
                    alert("Error: " + JSON.stringify(data.error || "No error details available"));
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
