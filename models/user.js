const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: [true, "Please provide an Email!"],
    unique: [true, "Email Exist"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password!"],
    unique: false,
  },
  userName: { type: String, required: true },
  // courses: [{ type: mongoose.Types.ObjectId, ref: "Courses" }],
  courses: [{ type: Number }],
});

module.exports = mongoose.model("Users", userSchema);
