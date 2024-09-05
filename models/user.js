const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
  password: {
    type: String,
    required: [true, "Hasło jest wymagane"],
  },
  email: {
    type: String,
    required: [true, "Email jest wymagany"],
    unique: true,
  },
  subscription: {
    type: String,
    enum: ["starter", "pro", "business"],
    default: "starter",
  },
  token: {
    type: String,
    default: null,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
