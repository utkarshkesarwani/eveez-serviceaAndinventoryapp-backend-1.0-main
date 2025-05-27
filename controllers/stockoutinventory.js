const InventoryCount = require("../model/inventoryCount");
const InventoryDetails = require("../model/inventoryDetails");
const Service_Request = require("../model/servicerequest");
const { getProductByMakeAndProductName } = require("./findobject");

async function StockOutOperation(req, res) {
  try {
    const location = req.user.location;
    const role = req.user.role;
    const hubIds = req.user.hub_id;

    const element = req.body.data;
    const { make, product_name, count, ticket_id } = element;

    console.log(location);

    if (count <= 0) {
      return res.json({ code: 0, message: "Count should be greater than 0" });
    }

    let srData = await Service_Request.find({ ticket_id });
    console.log(srData);
    if (srData.length === 0) {
      return res.status(404).json({ code: 0, message: "Ticket ID not Found" });
    }

    let consumer_technician = srData[0].assigned_to.technician;

    let query = {
      $or: [
        { make: make },
        { 'make ': make }
      ],
      $or: [
        { product_name: product_name },
        { 'product_name ': product_name }
      ]
    };

    // Apply filtering based on role
    if (role === "Inventory Manager" && hubIds && hubIds.length > 0) {
      query.hub_id = { $in: hubIds };
    } else if (role === "Manager") {
      query.$or.push({ location: location }, { 'location ': location });
    }

    let data = await InventoryCount.findOne(query).lean();

    if (data) {
      const availableCount = data.count || data['count '] || 0;

      if (availableCount >= count) {
        console.log("inside if");

        // Create a new entry for keeping history in the InventoryDetails
        let record = new InventoryDetails({
          operation: "stock_out",
          consumer_technician: consumer_technician,
          ticket_id: ticket_id,
          location: location,
          parts: [{ make, product_name, count }],
        });
        await record.save();

        // Decrement the count of product_name from the collection InventoryCount
        const updateQuery = {
          $and: [
            { $or: [{ make: make }, { "make ": make }] },
            { $or: [{ product_name: product_name }, { "product_name ": product_name }] }
          ]
        };

        if (role === "Inventory Manager" && hubIds && hubIds.length > 0) {
          updateQuery.$and.push({ hub_id: { $in: hubIds } });
        } else if (role === "Manager") {
          updateQuery.$and.push({ $or: [{ location: location }, { "location ": location }] });
        }

        await InventoryCount.updateOne(updateQuery, { $inc: { count: -count } });

        // Find ticket details
        let data1 = await Service_Request.findOne({ ticket_id });

        // Update requested_parts array
        for (let i = 0; i < data1.requested_parts.length; i++) {
          if (data1.requested_parts[i].make === make && 
              data1.requested_parts[i].product_name === product_name) {
            let part_Obj = data1.requested_parts[i];
            if (part_Obj.count === count) {
              data1.requested_parts.splice(i, 1);
            } else {
              part_Obj.count = part_Obj.count - count;
            }
            break;
          }
        }

        // Update spare_parts array
        let idxInSpareParts = await getProductByMakeAndProductName(
          make,
          product_name,
          data1.spare_parts
        );

        if (idxInSpareParts === -1) {
          data1.spare_parts.push({
            make,
            product_name,
            count,
            used_count: count,
            unused_count:0,
          });
        } else {
          data1.spare_parts[idxInSpareParts].count += count;
          data1.spare_parts[idxInSpareParts].used_count += count;
        }
        await data1.save();

        return res.json({ code: 1, message: "Inventory updated" });
      } else {
        // Not enough inventory
        return res.status(400).json({
          code: 0,
          message: `Not enough inventory. Available: ${availableCount}, Requested: ${count}`,
        });
      }
    } else {
      return res.status(400).json({
        code: 0,
        message: `You do not have ${product_name}, ${make} in your Inventory`,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ code: 0, message: "Internal server error" });
  }
}

module.exports = {
  StockOutOperation,
};