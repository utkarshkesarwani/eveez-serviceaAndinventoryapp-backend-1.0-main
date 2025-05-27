const mongoose = require("mongoose");

const issueTypeSchema = new mongoose.Schema({
  no: Number,
  name: String,
  time_limit: Number,
  under_warranty: Boolean,
  replacement: Boolean,
});

// creating a new collection
const issueType = mongoose.model("issuetype", issueTypeSchema);

//Exporting the model
module.exports = { issueType };
