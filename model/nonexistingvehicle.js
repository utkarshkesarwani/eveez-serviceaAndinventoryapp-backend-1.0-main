const mongoose = require("mongoose");

const nonExistingVehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  vehicle_no: { type: String, required: true },
  mob_number: { type: String, required: true },
  email: { type: String, required: true },
  location: { type: String, required: true },
  message: { type: String, required: true },
  chassis_number: {type: String, required: true},
//   key: { type: String, required: true },
//   token: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("NonExistingVehicle", nonExistingVehicleSchema);
