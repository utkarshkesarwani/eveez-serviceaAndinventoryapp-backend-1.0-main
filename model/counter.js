const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  counter: {
    type: Number,
  },
});

// creating a new collection
const Counter = new mongoose.model("Counter", counterSchema);

//Exporting the model
module.exports = Counter;
