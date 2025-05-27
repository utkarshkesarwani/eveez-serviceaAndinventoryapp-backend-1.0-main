const mongoose = require("mongoose");
const { Schema } = mongoose;

const qrCodeSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "users",
  },
  token: {
    type: String,
    default: "null",
  },
  generationCount: {
    type: Number,
    default: 0,
  },
  // isActive: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now() },
});

module.exports = mongoose.model("qrCode", qrCodeSchema);
