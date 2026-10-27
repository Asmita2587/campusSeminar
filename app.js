const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

const departments = ["CSE","AI","AIML", "ECE", "EEE", "MECH", "CIVIL", "IT"];

let seminars = [
    { id: 1, title: "Introduction to AI", speaker: "Dr. Meera Nair", date: "2026-11-12", time: "10:00", venue: "Main Auditorium", capacity: 120 },
    { id: 2, title: "Web Development with Node", speaker: "Mr. Arjun Rao", date: "2026-11-18", time: "14:00", venue: "Seminar Hall A", capacity: 60 },
    { id: 3, title: "Deep Learning Fundamentals", speaker: "Mr. Rahul Mishra", date: "2026-11-23", time: "12:00", venue: "I Seminar Hall", capacity: 80 }
];

let registrations = [];

// 1. Get all seminars with seats left
app.get("/api/seminars", (req, res) => {
    let list = seminars.map(s => {
        let count = registrations.filter(r => r.seminarId === s.id).length;
        return { ...s, seatsLeft: s.capacity - count };
    });
    res.json({ departments, seminars: list });
});

// 2. Add a new seminar
app.post("/api/seminars", (req, res) => {
    let { title, speaker, date, time, venue, capacity } = req.body;
    let seminar = { id: seminars.length + 1, title, speaker, date, time, venue, capacity: Number(capacity) };
    seminars.push(seminar);
    res.status(201).json({ message: "Seminar added successfully!", seminar });
});

// 3. Register a student
app.post("/api/register", (req, res) => {
    let { name, rollNo, email, mobile, department, year, seminarId } = req.body;
    let s = seminars.find(item => item.id == seminarId);
    let count = registrations.filter(r => r.seminarId == seminarId).length;

    if (!s || count >= s.capacity) {
        return res.status(409).json({ message: "Sorry, this seminar is full!" });
    }
    if (registrations.some(r => r.rollNo === rollNo && r.seminarId == seminarId)) {
        return res.status(409).json({ message: "Already registered for this seminar!" });
    }

    let registration = {
        id: "SEM" + Math.floor(1000 + Math.random() * 9000),
        name, rollNo, email, mobile, department, year,
        seminarId: s.id, seminarTitle: s.title,
        date: new Date().toLocaleDateString()
    };
    registrations.push(registration);
    res.status(201).json({ message: "Registration successful!", registration });
});

// 4. View all registrations
app.get("/api/registrations", (req, res) => res.json(registrations));

// 5. Find registration by ID
app.get("/api/registrations/:id", (req, res) => {
    let reg = registrations.find(r => r.id === req.params.id.toUpperCase());
    reg ? res.json(reg) : res.status(404).json({ message: "Registration not found" });
});

// 6. Cancel registration
app.delete("/api/registrations/:id", (req, res) => {
    let idx = registrations.findIndex(r => r.id === req.params.id.toUpperCase());
    if (idx === -1) return res.status(404).json({ message: "Registration not found" });
    registrations.splice(idx, 1);
    res.json({ message: "Registration cancelled successfully" });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));