const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    ticket_id: {
      type: String,
      required: true,
    },
    technician: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    hub: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const ServiceApprovalRequest = mongoose.model(
  "ServiceApprovalRequest",
  requestSchema
);

module.exports = { ServiceApprovalRequest };
