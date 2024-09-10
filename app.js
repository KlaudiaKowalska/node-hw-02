const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const connectDB = require("./db");
const path = require("path");

const contactsRouter = require("./routes/api/contacts");
const usersRouter = require("./routes/api/users");

const app = express();

connectDB();

app.use(logger("dev"));
app.use(cors());
app.use(express.json());

// Obsługa plików statycznych
app.use("/avatars", express.static("public/avatars"));

// Użyj routerów
app.use("/api/contacts", contactsRouter);
app.use("/api/users", usersRouter);

// Obsługa błędów 404
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Obsługa błędów serwera
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

module.exports = app;
