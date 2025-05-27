const mongoose = require("mongoose");

const tripDataSchema = new mongoose.Schema({
  imeino: String,
  startdatetime: Date,
  enddatetime: Date,
  distanceinkm: Number,
  duration: String,
});

tripDataSchema.pre("save", function (next) {
  this.distanceinkm = Number(Number(this.distanceinkm.toFixed(2)));
  next();
});

// creating a new collection
const tripData = mongoose.model("tripData", tripDataSchema);

//Exporting the model
module.exports = {
  tripData,
};
