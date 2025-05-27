const mongoose = require("mongoose");

const extrakmsDetailSchema = new mongoose.Schema({
  IMEINo: String,
  AssetName: String,
  RegistrationNo: String,
  Year: Number,
  Month: Number,
  lastcalledDate: Date,
  TotalDistance: Number,
  DistancePerDay: [],
  TodaysDistance: Number,
  flag: {
    type: Boolean,
    default: false,
  },
  //"charge": Number
});

// creating a new collection
const extrakmsDetails = mongoose.model("extrakmsDetails", extrakmsDetailSchema);

//Exporting the model
module.exports = {
  extrakmsDetails,
};
