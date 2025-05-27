const mongoose = require("mongoose");

const inventoryCountSchema = new mongoose.Schema({
  make: {
    type: String,
  },
  product_name: {
    type: String,
  },
  count: {
    type: Number,
  },

  location: {
    type: String,
  },

  hub_id: {
    type: [String],
  },
});

// creating a new collection
const InventoryCount = new mongoose.model(
  "inventorycountsnew",
  inventoryCountSchema, 
  "inventorycountsnew"
);

//Exporting the model
module.exports = InventoryCount;
