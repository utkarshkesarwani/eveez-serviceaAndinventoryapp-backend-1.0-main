const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  operation: {
    type: String,
  },
  // stockin, stockout

  //store mob_no
  consumer_technician: {
    type: Number,
    required: true,
  },

  parts: [
    {
      product_name: {
        type: String,
      },
      count: {
        type: Number,
      },
    },
  ],

  date: {
    type: Date,
    default: Date.now,
    set: function (value) {
      let today = new Date();
      let ISTDate = new Date(today.getTime() + 5.5 * 60 * 60 * 1000);
      return ISTDate;
    },
  },

  location: {
    type: String,
  },
});

// creating a new collection
const Inventory = new mongoose.model("Inventory", inventorySchema);

//Exporting the model
module.exports = Inventory;
