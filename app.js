const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

// ---------- Data (no database, only arrays) ----------
const departments = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT"];

const seminars = [
    { id: 1, title: "Introduction to Artificial Intelligence", speaker: "Dr. Meera Nair", date: "2026-11-12", time: "10:00", venue: "Main Auditorium", capacity: 120 },
    { id: 2, title: "Web Development with Node.js", speaker: "Mr. Arjun Rao", date: "2026-11-18", time: "14:00", venue: "Seminar Hall A", capacity: 60 },
    { id: 3, title: "Cyber Security Essentials", speaker: "Ms. Kavya Reddy", date: "2026-11-25", time: "11:00", venue: "Seminar Hall B", capacity: 3 },
    { id: 4, title: "Career Planning and Placements", speaker: "Mr. Suresh Kumar", date: "2026-12-02", time: "09:30", venue: "Main Auditorium", capacity: 150 }
];

const registrations = [];

// ---------- Helper functions ----------
function countRegistered(seminarId) {
    let count = 0;
    for (let i = 0; i < registrations.length; i++) {
        if (registrations[i].seminarId === seminarId) {
            count++;
        }
    }
    return count;
}

function makeId() {
    return "SEM" + Math.floor(1000 + Math.random() * 9000);
}

function todayDate() {
    const d = new Date();
    return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
}

// today as yyyy-mm-dd (same format as the date box in the form)
function todayIso() {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + month + "-" + day;
}

// ---------- Routes ----------
app.get("/about", function (req, res) {
    res.send("Campus Seminar Registration Portal");
});

// Send all seminars with seats left
app.get("/api/seminars", function (req, res) {
    const list = [];
    for (let i = 0; i < seminars.length; i++) {
        const s = seminars[i];
        list.push({
            id: s.id, title: s.title, speaker: s.speaker, date: s.date,
            time: s.time, venue: s.venue, capacity: s.capacity,
            seatsLeft: s.capacity - countRegistered(s.id)
        });
    }
    // earliest seminar first (yyyy-mm-dd text sorts correctly)
    list.sort(function (a, b) {
        return a.date < b.date ? -1 : 1;
    });
    res.json({ departments: departments, seminars: list });
});

// Add a new seminar
app.post("/api/seminars", function (req, res) {
    const data = req.body;
    const title = String(data.title || "").trim();
    const speaker = String(data.speaker || "").trim();
    const date = String(data.date || "").trim();
    const time = String(data.time || "").trim();
    const venue = String(data.venue || "").trim();
    const capacity = Number(data.capacity);

    if (title.length < 5) {
        return res.status(400).json({ message: "Title must have at least 5 characters." });
    }
    if (speaker.length < 3) {
        return res.status(400).json({ message: "Speaker name must have at least 3 characters." });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: "Select a valid date." });
    }
    if (date < todayIso()) {
        return res.status(400).json({ message: "The seminar date cannot be in the past." });
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
        return res.status(400).json({ message: "Select a valid time." });
    }
    if (venue.length < 2) {
        return res.status(400).json({ message: "Enter the venue." });
    }
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) {
        return res.status(400).json({ message: "Seats must be a whole number from 1 to 500." });
    }
    const duplicate = seminars.some(function (s) {
        return s.title.toLowerCase() === title.toLowerCase() && s.date === date;
    });
    if (duplicate) {
        return res.status(409).json({ message: "This seminar is already added for that date." });
    }

    const newId = seminars.length === 0 ? 1 : seminars[seminars.length - 1].id + 1;
    const seminar = { id: newId, title: title, speaker: speaker, date: date,
                      time: time, venue: venue, capacity: capacity };
    seminars.push(seminar);
    res.status(201).json({ message: "Seminar added successfully!", seminar: seminar });
});

// Register a student
app.post("/api/register", function (req, res) {
    const data = req.body;
    const name = String(data.name || "").trim();
    const rollNo = String(data.rollNo || "").trim().toUpperCase();
    const email = String(data.email || "").trim().toLowerCase();
    const mobile = String(data.mobile || "").trim();
    const department = String(data.department || "");
    const year = Number(data.year);
    const seminarId = Number(data.seminarId);

    const seminar = seminars.find(function (s) { return s.id === seminarId; });

    if (name.length < 3) {
        return res.status(400).json({ message: "Name must have at least 3 characters." });
    }
    if (rollNo.length < 5) {
        return res.status(400).json({ message: "Roll number must have at least 5 characters." });
    }
    if (!email.includes("@") || !email.includes(".")) {
        return res.status(400).json({ message: "Enter a valid email." });
    }
    if (mobile.length !== 10 || isNaN(Number(mobile))) {
        return res.status(400).json({ message: "Mobile number must have exactly 10 digits." });
    }
    if (!departments.includes(department)) {
        return res.status(400).json({ message: "Select a valid department." });
    }
    if (year < 1 || year > 4 || isNaN(year)) {
        return res.status(400).json({ message: "Select a valid year." });
    }
    if (!seminar) {
        return res.status(400).json({ message: "Select a valid seminar." });
    }
    if (countRegistered(seminarId) >= seminar.capacity) {
        return res.status(409).json({ message: "Sorry, this seminar is full." });
    }
    const duplicate = registrations.some(function (r) {
        return r.rollNo === rollNo && r.seminarId === seminarId;
    });
    if (duplicate) {
        return res.status(409).json({ message: "This roll number is already registered for this seminar." });
    }

    const registration = {
        id: makeId(), name: name, rollNo: rollNo, email: email, mobile: mobile,
        department: department, year: year, seminarId: seminarId,
        seminarTitle: seminar.title, date: todayDate()
    };
    registrations.push(registration);
    res.status(201).json({ message: "Registration successful!", registration: registration });
});

// All registered students (without email and mobile)
app.get("/api/registrations", function (req, res) {
    const list = [];
    for (let i = 0; i < registrations.length; i++) {
        const r = registrations[i];
        list.push({ id: r.id, name: r.name, rollNo: r.rollNo, department: r.department,
                    year: r.year, seminarTitle: r.seminarTitle, date: r.date });
    }
    res.json(list);
});

// Find one registration using its ID
app.get("/api/registrations/:id", function (req, res) {
    const id = req.params.id.toUpperCase();
    const reg = registrations.find(function (r) { return r.id === id; });
    if (!reg) {
        return res.status(404).json({ message: "No registration found with ID " + id });
    }
    res.json(reg);
});

// Cancel a registration
app.delete("/api/registrations/:id", function (req, res) {
    const id = req.params.id.toUpperCase();
    const index = registrations.findIndex(function (r) { return r.id === id; });
    if (index === -1) {
        return res.status(404).json({ message: "No registration found with ID " + id });
    }
    registrations.splice(index, 1);
    res.json({ message: "Registration " + id + " cancelled." });
});

app.listen(3000, function () {
    console.log("Campus Seminar Server Started at http://localhost:3000");
});