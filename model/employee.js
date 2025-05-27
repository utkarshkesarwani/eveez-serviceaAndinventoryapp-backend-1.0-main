const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  mob_number: {
    type: Number,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },

  Location: {
    type: String,
    required: true,
  },
});

// creating a new collection
const Employee = new mongoose.model("Employee", employeeSchema);

//Exporting the model
module.exports = Employee;
