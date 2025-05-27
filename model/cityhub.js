const mongoose = require("mongoose");

const cityHubSchema = new mongoose.Schema({
  name: String,
  cityCode: String,
  city_hub_id: String,
});

// creating a new collection
const cityHub = mongoose.model("cityhub", cityHubSchema);

//Exporting the model
module.exports = cityHub;