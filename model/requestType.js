const mongoose = require("mongoose");

const requestTypeSchema = new mongoose.Schema({
  name: String,
  request_type_id: String,
});

// creating a new collection
const requestTypeDetail = new mongoose.model("requestType", requestTypeSchema);

//Exporting the model
module.exports = { requestTypeDetail };
