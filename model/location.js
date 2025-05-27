const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  short_form: {
    type: String,
    required: true,
  },
  full_form: {
    type: String,
    required: true,
  },
});

// creating a new collection
const Location = new mongoose.model("Location", locationSchema);

//Exporting the model
module.exports = Location;
