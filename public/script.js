"use strict";
let seminars = [];
// ---------- Small helper functions ----------
function getBox(id) {
    return document.getElementById(id);
}
function getInput(id) {
    return document.getElementById(id);
}
function getSelect(id) {
    return document.getElementById(id);
}
// true if this page has an element with this id
function pageHas(id) {
    return document.getElementById(id) != null;
}
// Makes user text safe before using innerHTML
function safe(text) {
    return String(text).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function showMessage(boxId, text, ok) {
    if (!pageHas(boxId)) {
        return;
    }
    const box = getBox(boxId);
    box.className = ok ? "msg ok" : "msg err";
    box.textContent = text;
}
// 2026-11-12  ->  12/11/2026
function formatDate(isoDate) {
    const p = isoDate.split("-");
    return p[2] + "/" + p[1] + "/" + p[0];
}
// 14:00  ->  2:00 PM
function formatTime(time24) {
    const p = time24.split(":");
    let hour = Number(p[0]);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour == 0) {
        hour = 12;
    }
    return hour + ":" + p[1] + " " + ampm;
}
// today as yyyy-mm-dd
function todayIso() {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + month + "-" + day;
}
// ---------- AJAX (XMLHttpRequest) ----------
function sendRequest(method, url, data, done) {
    const xhttp = new XMLHttpRequest();
    xhttp.open(method, url, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function () {
        if (xhttp.readyState == 4) {
            try {
                done(xhttp.status, JSON.parse(xhttp.responseText));
            }
            catch (error) {
                done(0, { message: "Server not reachable. Is it running?" });
            }
        }
    };
    xhttp.send(data ? JSON.stringify(data) : null);
}
// ---------- SEMINARS PAGE (index.html) ----------
// Gets seminars from the server. Runs when "Show Seminars" is clicked,
// and also on the Register page to fill the dropdowns.
function loadSeminars() {
    sendRequest("GET", "/api/seminars", null, function (status, result) {
        if (status != 200) {
            showMessage("seminarMsg", result.message, false);
            return;
        }
        seminars = result.seminars;
        if (pageHas("seminarMsg")) {
            getBox("seminarMsg").className = "";
            getBox("seminarMsg").textContent = "";
        }
        if (pageHas("seminarList")) {
            showCards();
        }
        if (pageHas("seminarSelect")) {
            fillDropdowns(result.departments);
        }
    });
}
function showCards() {
    if (seminars.length == 0) {
        getBox("seminarList").innerHTML = "<p>No seminars yet. Add one from the Add Seminar page.</p>";
        return;
    }
    let output = "";
    for (let i = 0; i < seminars.length; i++) {
        const s = seminars[i];
        const full = s.seatsLeft <= 0;
        output += '<div class="card' + (full ? " full" : "") + '">' +
            "<h3>" + safe(s.title) + "</h3>" +
            "<p>Speaker: " + safe(s.speaker) + "</p>" +
            "<p>" + formatDate(s.date) + " at " + formatTime(s.time) + "</p>" +
            "<p>Venue: " + safe(s.venue) + "</p>" +
            "<p><b>" + (full ? "FULL" : s.seatsLeft + " of " + s.capacity + " seats left") + "</b></p>" +
            "</div>";
    }
    getBox("seminarList").innerHTML = output;
}
// ---------- REGISTER PAGE (register.html) ----------
function fillDropdowns(departments) {
    const dept = getSelect("department");
    const sem = getSelect("seminarSelect");
    const oldDept = dept.value;
    const oldSem = sem.value;
    dept.innerHTML = '<option value="">-- Select Department --</option>';
    for (let i = 0; i < departments.length; i++) {
        dept.innerHTML += "<option>" + departments[i] + "</option>";
    }
    sem.innerHTML = '<option value="">-- Select Seminar --</option>';
    for (let i = 0; i < seminars.length; i++) {
        const s = seminars[i];
        const full = s.seatsLeft <= 0;
        sem.innerHTML += '<option value="' + s.id + '"' + (full ? " disabled" : "") + ">" +
            safe(s.title) + (full ? " (Full)" : "") + "</option>";
    }
    dept.value = oldDept;
    sem.value = oldSem;
}
// Runs when the seminar dropdown changes (onchange)
function showDetails() {
    const id = Number(getSelect("seminarSelect").value);
    const box = getBox("seminarDetails");
    const s = seminars.find(function (item) { return item.id === id; });
    if (!s) {
        box.innerHTML = "";
        return;
    }
    box.innerHTML = "<b>" + safe(s.title) + "</b><br>Speaker: " + safe(s.speaker) +
        "<br>Date: " + formatDate(s.date) + " | Time: " + formatTime(s.time) +
        "<br>Venue: " + safe(s.venue) + "<br>Seats left: " + s.seatsLeft;
}
function registerStudent() {
    // READ + CLEAN
    const name = getInput("name").value.trim();
    const rollNo = getInput("rollNo").value.trim().toUpperCase();
    const email = getInput("email").value.trim().toLowerCase();
    const mobile = getInput("mobile").value.trim();
    const department = getSelect("department").value;
    const seminarId = getSelect("seminarSelect").value;
    const yearBox = document.querySelector('input[name="year"]:checked');
    // CHECK (validation)
    if (name == "" || name.length < 3) {
        showMessage("message", "Enter your full name (minimum 3 characters).", false);
        return;
    }
    if (rollNo.length < 5) {
        showMessage("message", "Roll number must have at least 5 characters.", false);
        return;
    }
    if (!email.includes("@") || !email.includes(".")) {
        showMessage("message", "Enter a valid email address.", false);
        return;
    }
    if (mobile.length != 10 || isNaN(Number(mobile))) {
        showMessage("message", "Mobile number must have exactly 10 digits.", false);
        return;
    }
    if (department == "") {
        showMessage("message", "Select your department.", false);
        return;
    }
    if (yearBox == null) {
        showMessage("message", "Select your year of study.", false);
        return;
    }
    if (seminarId == "") {
        showMessage("message", "Select a seminar.", false);
        return;
    }
    // ACCEPT: send to server
    const student = {
        name: name, rollNo: rollNo, email: email, mobile: mobile,
        department: department, year: Number(yearBox.value),
        seminarId: Number(seminarId)
    };
    sendRequest("POST", "/api/register", student, function (status, result) {
        if (status == 201) {
            showMessage("message", result.message, true);
            showTicket("ticket", result.registration);
            saveInBrowser(result.registration.id);
            document.getElementById("regForm").reset();
            getBox("seminarDetails").innerHTML = "";
            loadSeminars(); // refresh seats left in the dropdown
        }
        else {
            showMessage("message", result.message, false);
            getBox("ticket").innerHTML = "";
        }
    });
}
function showTicket(boxId, r) {
    getBox(boxId).innerHTML =
        '<div class="ticket">' +
            "<h3>Registration ID: " + safe(r.id) + "</h3>" +
            "<p>Name: " + safe(r.name) + " (" + safe(r.rollNo) + ")</p>" +
            "<p>" + safe(r.department) + " - Year " + r.year + "</p>" +
            "<p>Seminar: " + safe(r.seminarTitle) + "</p>" +
            "<p>Registered on: " + safe(r.date) + "</p>" +
            "</div>";
}
function clearMessages() {
    getBox("message").className = "";
    getBox("message").textContent = "";
    getBox("ticket").innerHTML = "";
    getBox("seminarDetails").innerHTML = "";
}
// ---------- ADD SEMINAR PAGE (add-seminar.html) ----------
function addSeminar() {
    // READ + CLEAN
    const title = getInput("title").value.trim();
    const speaker = getInput("speaker").value.trim();
    const date = getInput("date").value;
    const time = getInput("time").value;
    const venue = getInput("venue").value.trim();
    const capacity = getInput("capacity").value.trim();
    // CHECK
    if (title.length < 5) {
        showMessage("message", "Title must have at least 5 characters.", false);
        return;
    }
    if (speaker.length < 3) {
        showMessage("message", "Speaker name must have at least 3 characters.", false);
        return;
    }
    if (date == "") {
        showMessage("message", "Select the seminar date.", false);
        return;
    }
    if (date < todayIso()) {
        showMessage("message", "The seminar date cannot be in the past.", false);
        return;
    }
    if (time == "") {
        showMessage("message", "Select the seminar time.", false);
        return;
    }
    if (venue.length < 2) {
        showMessage("message", "Enter the venue.", false);
        return;
    }
    const seats = Number(capacity);
    if (capacity == "" || isNaN(seats) || seats < 1 || seats > 500) {
        showMessage("message", "Seats must be a number from 1 to 500.", false);
        return;
    }
    // ACCEPT
    const newSeminar = {
        title: title, speaker: speaker, date: date,
        time: time, venue: venue, capacity: seats
    };
    sendRequest("POST", "/api/seminars", newSeminar, function (status, result) {
        showMessage("message", result.message, status == 201);
        if (status == 201) {
            document.getElementById("addForm").reset();
        }
    });
}
function clearAddMessage() {
    getBox("message").className = "";
    getBox("message").textContent = "";
}
// ---------- MY REGISTRATION PAGE (my-registration.html) ----------
function saveInBrowser(id) {
    try {
        localStorage.setItem("lastRegId", id);
    }
    catch (error) {
        console.log("Browser storage not available");
    }
}
function viewSaved() {
    try {
        const id = localStorage.getItem("lastRegId");
        if (id == null) {
            showMessage("lookupMsg", "No saved registration in this browser.", false);
            return;
        }
        getInput("lookupId").value = id;
        findRegistration();
    }
    catch (error) {
        showMessage("lookupMsg", "Browser storage not available.", false);
    }
}
function findRegistration() {
    const id = getInput("lookupId").value.trim().toUpperCase();
    if (id == "") {
        showMessage("lookupMsg", "Enter a registration ID.", false);
        return;
    }
    sendRequest("GET", "/api/registrations/" + id, null, function (status, result) {
        if (status == 200) {
            getBox("lookupMsg").className = "";
            getBox("lookupMsg").textContent = "";
            showTicket("lookupResult", result);
        }
        else {
            getBox("lookupResult").innerHTML = "";
            showMessage("lookupMsg", result.message, false);
        }
    });
}
function cancelRegistration() {
    const id = getInput("lookupId").value.trim().toUpperCase();
    if (id == "") {
        showMessage("lookupMsg", "Enter the ID you want to cancel.", false);
        return;
    }
    if (!confirm("Cancel registration " + id + "?")) {
        return;
    }
    sendRequest("DELETE", "/api/registrations/" + id, null, function (status, result) {
        showMessage("lookupMsg", result.message, status == 200);
        getBox("lookupResult").innerHTML = "";
    });
}
// ---------- STUDENTS PAGE (students.html) ----------
function loadRegistrations() {
    sendRequest("GET", "/api/registrations", null, function (status, rows) {
        if (status != 200 || rows.length == 0) {
            getBox("registrationTable").innerHTML = "<p>No registrations yet.</p>";
            return;
        }
        let output = "<table><tr><th>ID</th><th>Name</th><th>Roll No</th><th>Dept</th>" +
            "<th>Year</th><th>Seminar</th><th>Date</th></tr>";
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            output += "<tr><td>" + safe(r.id) + "</td><td>" + safe(r.name) + "</td><td>" +
                safe(r.rollNo) + "</td><td>" + safe(r.department) + "</td><td>" + r.year +
                "</td><td>" + safe(r.seminarTitle) + "</td><td>" + safe(r.date) + "</td></tr>";
        }
        getBox("registrationTable").innerHTML = output + "</table>";
    });
}
// ---------- START: each page runs only what it needs ----------
if (pageHas("seminarSelect")) { // Register page
    loadSeminars();
}
if (pageHas("registrationTable")) { // Students page
    loadRegistrations();
}
if (pageHas("addForm")) { // Add Seminar page
    getInput("date").min = todayIso(); // block past dates in the calendar
}
// The Seminars page waits for the "Show Seminars" button.
