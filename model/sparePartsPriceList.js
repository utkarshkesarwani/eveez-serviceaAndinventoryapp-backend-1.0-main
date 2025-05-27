const mongoose = require("mongoose");

const sparepartspricelistSchema = new mongoose.Schema({
  make: { type: String, default: "" },
  spare_part_name: {
    type: String,
    default: "",
  },
  cost_price: {
    type: Number,
    default: "",
  },
  rider_price: { 
    type: Number,
     default: "" 
    },
});

// creating a new collection
const sparepartspricelist = new mongoose.model(
  "sparepartsprices",
  sparepartspricelistSchema
);

//Exporting the model
module.exports = { sparepartspricelist };
