
const API = "http://127.0.0.1:8000/api";

let currentLocation = null;


// API REQUEST FUNCTION

async function apiRequest(endpoint, options = {}) {

    const response = await fetch(API + endpoint, {

        headers: {
            "Content-Type": "application/json"
        },

        ...options

    });

    if (!response.ok) {

        const error = await response.json();

        throw new Error(error.detail || "API Error");

    }

    return response.json();

}


// TOAST

function showToast(message) {

    const toast = document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}


// HTML ESCAPE

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, char => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"

    })[char]);

}


// CHECK BACKEND

async function checkBackend() {

    try {

        await apiRequest("/health");

        document.getElementById("apiStatus").textContent =
            "API Online";

    } catch {

        document.getElementById("apiStatus").textContent =
            "API Offline";

    }

}


// LOCATION DETECTION

function detectLocation() {

    if (!navigator.geolocation) {

        showToast("Location not supported.");

        return;

    }

    document.getElementById("locationText").textContent =
        "Detecting location...";

    navigator.geolocation.getCurrentPosition(

        function(position) {

            currentLocation = {

                latitude: position.coords.latitude,

                longitude: position.coords.longitude

            };

            const lat = currentLocation.latitude;

            const lon = currentLocation.longitude;

            document.getElementById("locationText").textContent =
                `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

            document.getElementById("heroLocation").textContent =
                "Detected";

            document.getElementById("mapContainer").innerHTML = `

                <a target="_blank"
                   rel="noopener"
                   href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}">

                   🗺️ Open Your Location On Map

                </a>

            `;

            showToast("Location detected successfully.");

        },

        function(error) {

            document.getElementById("locationText").textContent =
                "Location unavailable: " + error.message;

            showToast("Please allow location permission.");

        },

        {
            enableHighAccuracy: true,
            timeout: 12000
        }

    );

}


// HOSPITAL SEARCH

async function findHospitals() {

    if (!currentLocation) {

        showToast("Detect location first.");

        return;

    }

    const status = document.getElementById("hospitalStatus");

    const list = document.getElementById("hospitalList");

    status.textContent = "Searching hospitals...";

    try {

        const hospitals = await apiRequest(

            `/hospitals?lat=${currentLocation.latitude}&lon=${currentLocation.longitude}`

        );

        status.textContent =
            hospitals.length + " mapped hospital(s) found.";

        list.innerHTML = hospitals.map(hospital => `

            <li>

                <strong>${escapeHTML(hospital.name)}</strong>

                <br>

                <a target="_blank"
                   rel="noopener"
                   href="https://www.openstreetmap.org/?mlat=${hospital.latitude}&mlon=${hospital.longitude}">

                   View Map

                </a>

            </li>

        `).join("");

        if (!hospitals.length) {

            status.textContent = "No mapped hospitals found.";

        }

    } catch (error) {

        status.textContent = error.message;

    }

}


// SOS MODAL

function openSOS() {

    document.getElementById("sosModal")
        .classList.remove("hidden");

}


function closeSOS() {

    document.getElementById("sosModal")
        .classList.add("hidden");

}


// CONFIRM DEMO SOS

async function confirmSOS() {

    try {

        const data = {

            category:
                document.getElementById("sosCategory").value,

            details:
                document.getElementById("sosDetails").value,

            ...(currentLocation || {})

        };

        const result = await apiRequest("/sos", {

            method: "POST",

            body: JSON.stringify(data)

        });

        closeSOS();

        document.getElementById("sosStatus").textContent =
            "DEMO";

        document.getElementById("sosText").textContent =
            "Demo SOS saved. No one was contacted.";

        showToast(result.message);

        loadHistory();

    } catch (error) {

        showToast(error.message);

    }

}


// EMERGENCY HISTORY

async function loadHistory() {

    try {

        const history = await apiRequest("/history");

        const list = document.getElementById("historyList");

        list.innerHTML = history.map(item => `

            <li>

                <strong>${escapeHTML(item.category)}</strong>

                <br>

                <small>
                    ${new Date(item.created_at).toLocaleString()}
                </small>

            </li>

        `).join("");

        if (!history.length) {

            list.innerHTML = "<li>No history available.</li>";

        }

    } catch {

        document.getElementById("historyList").innerHTML =
            "<li>Backend unavailable.</li>";

    }

}


// CLEAR HISTORY

async function clearHistory() {

    try {

        await apiRequest("/history", {

            method: "DELETE"

        });

        showToast("History cleared.");

        loadHistory();

    } catch (error) {

        showToast(error.message);

    }

}


// EMERGENCY CONTACTS

async function loadContacts() {

    try {

        const contacts = await apiRequest("/contacts");

        const list = document.getElementById("contactsList");

        list.innerHTML = contacts.map(contact => `

            <li>

                <span>

                    <strong>${escapeHTML(contact.name)}</strong>

                    <br>

                    ${escapeHTML(contact.phone)}

                    ${contact.relationship
                        ? " · " + escapeHTML(contact.relationship)
                        : ""}

                </span>

                <button onclick="deleteContact(${contact.id})">

                    Delete

                </button>

            </li>

        `).join("");

        if (!contacts.length) {

            list.innerHTML = "<li>No contacts added.</li>";

        }

    } catch {

        document.getElementById("contactsList").innerHTML =
            "<li>Backend unavailable.</li>";

    }

}


// ADD CONTACT

document.getElementById("contactForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const data = {

            name:
                document.getElementById("contactName").value,

            phone:
                document.getElementById("contactPhone").value,

            relationship:
                document.getElementById("contactRelation").value

        };

        try {

            await apiRequest("/contacts", {

                method: "POST",

                body: JSON.stringify(data)

            });

            this.reset();

            loadContacts();

            showToast("Contact added successfully.");

        } catch (error) {

            showToast(error.message);

        }

    });


// DELETE CONTACT

async function deleteContact(id) {

    try {

        await apiRequest(`/contacts/${id}`, {

            method: "DELETE"

        });

        loadContacts();

        showToast("Contact deleted.");

    } catch (error) {

        showToast(error.message);

    }

}


// AI CHAT

function addMessage(message, type) {

    const chat = document.getElementById("chatMessages");

    const div = document.createElement("div");

    div.className = type + "-message";

    div.textContent = message;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;

}


async function sendMessage(message) {

    addMessage(message, "user");

    try {

        const result = await apiRequest("/assistant", {

            method: "POST",

            body: JSON.stringify({

                message: message

            })

        });

        addMessage(result.reply, "bot");

    } catch {

        addMessage(
            "Backend is unavailable. Please start the server.",
            "bot"
        );

    }

}


// CHAT FORM

document.getElementById("chatForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const input = document.getElementById("chatInput");

        const message = input.value.trim();

        if (!message) return;

        input.value = "";

        sendMessage(message);

    });


// QUICK ACTIONS

function quickMessage(message) {

    document.getElementById("assistant")
        .scrollIntoView({

            behavior: "smooth"

        });

    sendMessage(message);

}


// VOICE INPUT

function startVoice() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        showToast("Voice recognition not supported.");

        return;

    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.onresult = function(event) {

        document.getElementById("chatInput").value =
            event.results[0][0].transcript;

    };

    recognition.start();

}


// REFRESH DASHBOARD

function refreshDashboard() {

    checkBackend();

    loadHistory();

    loadContacts();

    showToast("Dashboard refreshed.");

}


// INITIALIZATION

checkBackend();

loadHistory();

loadContacts();
