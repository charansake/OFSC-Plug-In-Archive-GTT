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
                const targetOrigin = "https://atni1.test.fs.ocs.oraclecloud.com"; // Ensure this matches your parent page origin
                const currentOrigin = window.location.origin;

                // Allow any origin during local development
                const allowedOrigins = ["null", "http://localhost:8000"];

                if (allowedOrigins.includes(currentOrigin)) {
                    console.log("Sending message with wildcard target origin");
                    parent.postMessage(JSON.stringify(data), "*");
                } else {
                    console.log("Sending message with specific target origin");
                    parent.postMessage(JSON.stringify(data), targetOrigin);
                }
            } catch (error) {
                console.error("Error sending post message data:", error);
            }
        };

        // Open the activity data and update the UI
        this.open = function (data) {
            try {
                const fields = [
                    { id: "customerName", value: data.activity?.customerName || "" },
                    { id: "streetAddress", value: data.activity?.streetAddress || "" },
                    { id: "city", value: data.activity?.city || "" },
                    { id: "customerNumber", value: data.activity?.customerNumber || "" },
                    { id: "timeZone", value: data.activity?.timeZone || "" },
                    { id: "aworktype", value: data.activity?.aworktype || "" },
                    { id: "gtt_technician_comments", value: data.activity?.gtt_technician_comments || "" },
                    { id: "astatus", value: data.activity?.astatus || "" },
                    { id: "cname", value: data.activity?.cname || "" },
                    { id: "date", value: data.activity?.date || "" },
                    { id: "aid", value: data.activity?.aid || "" },
                    { id: "ccity", value: data.activity?.ccity || "" },
                    { id: "gtt_service_type", value: data?.gtt_service_type || "" },
                    { id: "gtt_voice_plan", value: data?.gtt_voice_plan || "" },
                    { id: "gtt_fwa_promo_code", value: data?.gtt_fwa_promo_code || "" }
                ];

                fields.forEach(field => {
                    const element = document.getElementById(field.id);
                    if (element) {
                        element.innerText = field.value;
                    } else {
                        console.warn(`Element with ID ${field.id} not found.`);
                    }
                });

                // Add event listeners
                const submitButton = document.getElementById("Submit");
                if (submitButton) {
                    submitButton.addEventListener("click", () => {
                        setTimeout(() => {
                            this.submitData(data);
                        }, 0);
                    }, { passive: true });
                } else {
                    console.warn("Submit button not found.");
                }

                const dismissButton = document.getElementById("Dismiss");
                if (dismissButton) {
                    dismissButton.addEventListener("click", () => {
                        this.sendPostMessageData({ apiVersion: 1, method: "close" });
                    }, { passive: true });
                } else {
                    console.warn("Dismiss button not found.");
                }
            } catch (e) {
                console.error("Error processing activity data:", e);
            }
        };

        // Submit data after capturing signature
        this.submitData = function (data) {
            const commentElement = document.getElementById("gtt_technician_comments");
            if (commentElement) {
                const comment = commentElement.value;
                if (comment && comment.trim()) {
                    try {
                        this.sendPostMessageData({
                            apiVersion: 1,
                            method: "update",
                            activity: {
                                Name: data.activity?.resource_name ?? 'charan',
                                City: data.activity?.ccity ?? 'atp',
                                aworktype: data.activity?.aworktype ?? 'gttso',
                                gtt_technician_comments: comment.trim(),
                                cname: data.activity?.cname ?? 'test',
                                activityId: data.activity?.aid ?? '123123',
                                Comment: comment.trim()
                            }
                        });

                        // Log success message for debugging
                        console.log("Data submitted successfully:", {
                            Name: data.activity?.resource_name ?? 'charan',
                            City: data.activity?.ccity ?? 'atp',
                            aworktype: data.activity?.aworktype ?? 'gttso',
                            gtt_technician_comments: comment.trim(),
                            cname: data.activity?.cname ?? 'testing',
                            activityId: data.activity?.aid ?? '123123',
                            Comment: comment.trim()
                        });

                        alert("Form submitted successfully!");

                        // Redirect to previous screen
                        window.history.back(); // Go back to the previous page
                    } catch (e) {
                        console.error("Error submitting data:", e);
                    }
                } else {
                    alert("Please enter a comment before submitting.");
                }
            } else {
                console.error("Element with ID 'gtt_technician_comments' not found");
            }
        };

        // Capture the signature from the canvas and then submit
        this.captureSignature = function (data) {
            try {
                const canvas = document.getElementById("gtt_engineer_signature");
                if (canvas) {
                    const img = document.getElementById("SFA_FSR_CUS");
                    if (img) {
                        img.src = canvas.toDataURL("image/png");
                        this.submitData(data);
                    } else {
                        console.warn("Signature image element not found.");
                    }
                } else {
                    console.error("Canvas element for signature not found.");
                }
            } catch (error) {
                console.error("Error capturing signature:", error);
            }
        };

        // Clear the signature canvas
        this.clearSignature = function () {
            try {
                const canvas = document.getElementById("gtt_engineer_signature");
                if (canvas) {
                    const ctx = canvas.getContext("2d");
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                } else {
                    console.error("Canvas element for signature not found.");
                }
            } catch (error) {
                console.error("Error clearing signature:", error);
            }
        };

        // Message listener to handle responses from the parent system
        this._messageListener = function (event) {
            try {
                const data = JSON.parse(event.data);

                // Check for undefined error object
                if (data.method === "error") {
                    if (!data.error) {
                        console.warn("Error received from parent, but error object is undefined.");
                        alert("An error occurred, but no details were provided.");
                        return; // Exit early if no error object is provided
                    } else {
                        console.error("Error received from parent:", JSON.stringify(data.error));
                        alert("Error: " + JSON.stringify(data.error));
                    }
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
                    case "error":
                        console.error("Error received from parent:", JSON.stringify(data.error || "No error details available"));
                        alert("Error: " + JSON.stringify(data.error || "No error details available"));
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

    window.addEventListener("load", function () {
        const plugin = new OfscPlugin();
        plugin.init();
    });
})();
