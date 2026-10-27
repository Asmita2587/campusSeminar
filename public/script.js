let seminars = [];

const $ = id => document.getElementById(id);

// AJAX helper (Week 10 XMLHttpRequest)
function ajax(method, url, data, cb) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) cb(xhr.status, JSON.parse(xhr.responseText || "{}"));
    };
    xhr.send(data ? JSON.stringify(data) : null);
}

// 1. Load Seminars (for index.html and register.html)
function loadSeminars() {
    ajax("GET", "/api/seminars", null, (status, data) => {
        if (status != 200) return;
        seminars = data.seminars;

        if ($("seminarList")) {
            $("seminarList").innerHTML = seminars.map(s => `
                <div class="card ${s.seatsLeft <= 0 ? "full" : ""}">
                    <h3>${s.title}</h3>
                    <p>Speaker: ${s.speaker}</p>
                    <p>${s.date} at ${s.time}</p>
                    <p>Venue: ${s.venue}</p>
                    <p><b>${s.seatsLeft <= 0 ? "FULL" : s.seatsLeft + " seats left"}</b></p>
                </div>
            `).join("");
        }

        if ($("seminarSelect")) {
            $("department").innerHTML = '<option value="">-- Select Department --</option>' +
                data.departments.map(d => `<option>${d}</option>`).join("");
            $("seminarSelect").innerHTML = '<option value="">-- Select Seminar --</option>' +
                seminars.map(s => `<option value="${s.id}" ${s.seatsLeft <= 0 ? "disabled" : ""}>${s.title} ${s.seatsLeft <= 0 ? "(Full)" : ""}</option>`).join("");
        }
    });
}

// 2. Seminar dropdown details
function showDetails() {
    let s = seminars.find(item => item.id == $("seminarSelect").value);
    $("seminarDetails").innerHTML = s ? `<b>${s.title}</b><br>Speaker: ${s.speaker}<br>Date: ${s.date} at ${s.time}<br>Venue: ${s.venue}<br>Seats left: ${s.seatsLeft}` : "";
}

// 3. Register student
function registerStudent() {
    let yr = document.querySelector('input[name="year"]:checked');
    let data = {
        name: $("name").value.trim(),
        rollNo: $("rollNo").value.trim(),
        email: $("email").value.trim(),
        mobile: $("mobile").value.trim(),
        department: $("department").value,
        year: yr ? yr.value : "",
        seminarId: $("seminarSelect").value
    };

    if (!data.name || !data.rollNo || !data.email || !data.mobile || !data.department || !data.year || !data.seminarId) {
        $("message").className = "msg err";
        $("message").innerText = "Please fill all fields!";
        return;
    }

    ajax("POST", "/api/register", data, (status, res) => {
        $("message").className = status == 201 ? "msg ok" : "msg err";
        $("message").innerText = res.message;
        if (status == 201) {
            $("ticket").innerHTML = `<div class="ticket"><h3>Registration ID: ${res.registration.id}</h3><p>Name: ${res.registration.name} (${res.registration.rollNo})</p><p>Seminar: ${res.registration.seminarTitle}</p><p>Date: ${res.registration.date}</p></div>`;
            localStorage.setItem("lastRegId", res.registration.id);
            $("regForm").reset();
            $("seminarDetails").innerHTML = "";
            loadSeminars();
        }
    });
}

function clearMessages() {
    $("message").innerText = "";
    $("ticket").innerHTML = "";
    $("seminarDetails").innerHTML = "";
}

// 4. Add Seminar
function addSeminar() {
    let data = {
        title: $("title").value.trim(),
        speaker: $("speaker").value.trim(),
        date: $("date").value,
        time: $("time").value,
        venue: $("venue").value.trim(),
        capacity: $("capacity").value
    };

    if (!data.title || !data.speaker || !data.date || !data.time || !data.venue || !data.capacity) {
        $("message").className = "msg err";
        $("message").innerText = "Please fill all fields!";
        return;
    }

    ajax("POST", "/api/seminars", data, (status, res) => {
        $("message").className = status == 201 ? "msg ok" : "msg err";
        $("message").innerText = res.message;
        if (status == 201) $("addForm").reset();
    });
}

function clearAddMessage() { $("message").innerText = ""; }

// 5. My Registration Lookup & Cancel
function findRegistration() {
    let id = $("lookupId").value.trim().toUpperCase();
    if (!id) return;
    ajax("GET", "/api/registrations/" + id, null, (status, res) => {
        if (status == 200) {
            $("lookupMsg").innerText = "";
            $("lookupResult").innerHTML = `<div class="ticket"><h3>Registration ID: ${res.id}</h3><p>Name: ${res.name} (${res.rollNo})</p><p>Seminar: ${res.seminarTitle}</p></div>`;
        } else {
            $("lookupResult").innerHTML = "";
            $("lookupMsg").className = "msg err";
            $("lookupMsg").innerText = res.message;
        }
    });
}

function viewSaved() {
    let id = localStorage.getItem("lastRegId");
    if (id) {
        $("lookupId").value = id;
        findRegistration();
    } else {
        $("lookupMsg").className = "msg err";
        $("lookupMsg").innerText = "No saved registration found.";
    }
}

function cancelRegistration() {
    let id = $("lookupId").value.trim().toUpperCase();
    if (!id || !confirm("Cancel registration " + id + "?")) return;
    ajax("DELETE", "/api/registrations/" + id, null, (status, res) => {
        $("lookupMsg").className = status == 200 ? "msg ok" : "msg err";
        $("lookupMsg").innerText = res.message;
        $("lookupResult").innerHTML = "";
    });
}

// 6. Registered Students Table
function loadRegistrations() {
    ajax("GET", "/api/registrations", null, (status, list) => {
        if (status != 200 || !list.length) {
            $("registrationTable").innerHTML = "<p>No registrations yet.</p>";
            return;
        }
        let rows = list.map(r => `<tr><td>${r.id}</td><td>${r.name}</td><td>${r.rollNo}</td><td>${r.department}</td><td>${r.year}</td><td>${r.seminarTitle}</td><td>${r.date}</td></tr>`).join("");
        $("registrationTable").innerHTML = `<table><tr><th>ID</th><th>Name</th><th>Roll No</th><th>Dept</th><th>Year</th><th>Seminar</th><th>Date</th></tr>${rows}</table>`;
    });
}

// Auto-run on page load
if ($("seminarSelect")) loadSeminars();
if ($("registrationTable")) loadRegistrations();