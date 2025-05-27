const InventoryCount = require("../model/inventoryCount");
const InventoryDetails = require("../model/inventoryDetails");
const Service_Request = require("../model/servicerequest");
const { getProductByMakeAndProductName } = require("./findobject");

async function hubExchangeOperation(req, res) {
  //   const session = await mongoose.startSession();
  //   console.log(session);
  //   session.startTransaction();

  try {
    let { inventory_manager, exchange_hub_id, make, product_name, count } =
      req.body.data;
    let location = req.user.location;
    let hub_id = req.user.hub_id;

    if (count <= 0) {
      res.status(400).json({
        code: 0,
        message: `${ele.make}, ${ele.product_name} count should be greater than 0`,
      });
      return;
    }
    console.log(make, product_name, location, hub_id);

    //check part status/count in sender's inventory
    let partData = await InventoryCount.findOne(
      {
        make,
        product_name,
        location,
        hub_id,
      },
      { _id: 1, make: 1, product_name: 1, count: 1 }
    );

    console.log("bef", partData);

    // check all the cases before giving the part;
    if (partData) {
      if (partData.count == 0) {
        return res.status(400).json({
          code: 0,
          message: "Part has zero count in your Inventory",
        });
      } else {
        //if desired/requested count is greater than Inventory's count
        if (count > partData.count) {
          return res.status(400).json({
            code: 0,
            message: `You have only count ${partData.count} for part ${product_name}, ${make}`,
          });
        }
      }
    } else {
      return res.status(400).json({
        code: 0,
        message: "Part is not available in your Inventory",
      });
    }

    //record to be saved in the inventory who is giving part in the exchange
    let senderRecord = new InventoryDetails({
      operation: "stockout",
      consumer_technician: null,
      parts: { make, product_name, count },
      exchange: {
        check: true,
        from_hub_id: hub_id,
        to_hub_id: exchange_hub_id,
      },
      location,
      hub_id,
    });
    console.log("sender", senderRecord);

    //deduct the count from sender's inventory
    partData.count -= count;

    let receiverRecord = new InventoryDetails({
      operation: "stockin",
      consumer_technician: null,
      parts: { make, product_name, count },
      exchange: {
        check: true,
        from_hub_id: hub_id,
        to_hub_id: exchange_hub_id,
      },
      location,
      hub_id: exchange_hub_id,
    });

    console.log("receiver", receiverRecord);

    await senderRecord.save();
    await receiverRecord.save();
    await partData.save();

    // If everything goes well, commit the transaction
    let afterpartData = await InventoryCount.findOne(
      {
        make,
        product_name,
        location,
        hub_id,
      },
      { _id: 1, make: 1, product_name: 1, count: 1 }
    );
    console.log("after", afterpartData);

    return res.status(200).json({
      code: 1,
      message: `Hub Exchange from for ${product_name} for count ${count} done successfully`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ code: 0, message: `Error: ${error.message}` });
  }
}

module.exports = {
  hubExchangeOperation,
};
