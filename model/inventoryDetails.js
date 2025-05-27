const mongoose = require("mongoose");
const InventoryCount = require("./inventoryCount");

//console.log(InventoryCount);

const inventoryDetailsSchema = new mongoose.Schema({
  operation: {
    type: String,
  },
  // stockin, stockout
  consumer_technician: {
    type: String,
  },

  ticket_id: {
    type: String,
  },

  parts: [
    {
      make: {
        type: String,
      },
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
    required: true,
  },
  hub_id: {
    type: [String],
  },
  exchange: {
    check: Boolean,
    from_hub_id: [String],
    to_hub_id: [String],
  },
});

// define pre-save middleware function to update InventoryCount collection
// inventoryDetailsSchema.pre("save", async function (next) {
//   if (this.operation === "stockin") {
//     try {
//       for (let i = 0; i < this.parts.length; i++) {
//         const part = this.parts[i];
//         const inventoryCount = await InventoryCount.findOne({
//           make: part.make,
//           product_name: part.product_name,
//           location: this.location,
//         });
//         if (!inventoryCount) {
//           const newInventoryCount = new InventoryCount({
//             make: part.make,
//             product_name: part.product_name,
//             count: part.count,
//             location: this.location,
//           });
//           await newInventoryCount.save();
//         } else {
//           inventoryCount.count += part.count;
//           await inventoryCount.save();
//         }
//       }
//     } catch (err) {
//       console.log(`${err}`);
//       return next(err);
//     }
//   }
//   return next();
// });

// creating a new collection
const InventoryDetails = mongoose.model(
  "InventoryDetails",
  inventoryDetailsSchema
);

//Exporting the model
module.exports = InventoryDetails;
