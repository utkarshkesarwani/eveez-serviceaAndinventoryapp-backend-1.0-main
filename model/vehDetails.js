const mongoose = require("mongoose");

const vehicleDetailSchema = new mongoose.Schema({
  Make: String,
  Status: String,
  Model: String,
  "Vehicle Name": String,
  Location: String,
  Type: String,
  "Company Name (from Subsc)": String,
  Chasis: String,
  "Battery Swap Key or Card No": String,
  Motor: String,
});

// creating a new collection
const vehicleDetails = mongoose.model("vehicleDetails", vehicleDetailSchema);

//Exporting the model
module.exports = {
  vehicleDetails,
};
