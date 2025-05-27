const mongoose = require("mongoose");
const partSchema = new mongoose.Schema({
  make: {
    type: String,
    required: true,
  },
  product_name: {
    type: String,
    required: true,
  },
  price:{
    type: Number,
    default:0,
  }
});
// creating a new collection
const Part = new mongoose.model("Part", partSchema);
//Exporting the model
module.exports = Part;