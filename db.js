// db.js
const mongoose = require("mongoose");
require("dotenv").config(); // Załaduj zmienne środowiskowe z pliku .env

const dbURI = process.env.DB_HOST; // Pobierz URL z zmiennej środowiskowej

const connectDB = async () => {
  try {
    await mongoose.connect(dbURI);
    console.log("Database connection successful.");
  } catch (error) {
    console.error("Błąd podczas łączenia z bazą danych:", error.message);
    process.exit(1); // Zakończ proces, jeśli nie udało się połączyć
  }
};

module.exports = connectDB;
