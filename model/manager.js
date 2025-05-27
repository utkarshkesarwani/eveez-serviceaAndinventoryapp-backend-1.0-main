const mongoose = require("mongoose");

const managerSchema = new mongoose.Schema({
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
const Manager = new mongoose.model("Manager", managerSchema);

//Exporting the model
module.exports = Manager;
