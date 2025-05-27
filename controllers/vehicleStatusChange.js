const Service_Request = require("../model/servicerequest");
const mongoose = require("mongoose");

async function changeVehicleStatus(vehicle, status) {
  try {
    console.log("Changing vehicle status for:", vehicle);
    
    const collection = mongoose.connection.collection("hubapp_master_data_latest_new");
    
    const currentTimestamp = new Date();
    console.log("New timestamp to be set:", currentTimestamp);
    
    const existingDoc = await collection.findOne({ "Vehicle No": vehicle });
    console.log("Found document before update:", existingDoc ? "Yes" : "No");
    if (existingDoc) {
      console.log("Current timestamp before update:", existingDoc.TimeStamp);
    }
    
    const result = await collection.findOneAndUpdate(
      { "Vehicle No": vehicle },
      { 
        $set: { 
          "Current Status": "Under Repair (Minor Damage)",
          "TimeStamp": currentTimestamp
        } 
      },
      { 
        returnDocument: 'after',
        upsert: false
      }
    );
    
    console.log("Update operation completed");
    
    const updatedDoc = await collection.findOne({ "Vehicle No": vehicle });
    if (updatedDoc) {
      console.log("Document after update - Status:", updatedDoc["Current Status"]);
      console.log("Document after update - Timestamp:", updatedDoc.TimeStamp);
    } else {
      console.log("Could not find document after update");
    }
    
    if (result.value) {
      console.log("Vehicle status and timestamp updated successfully");
      return true;
    } else {
      console.log("No document matched the query or update failed");
      return false;
    }
  } catch (e) {
    console.log("Error in changeVehicleStatus:", e);
    console.log("Error stack:", e.stack);
    return false;
  }
}

async function change_Vehicle_Status_To_RFD(ticketId) {
  try {
    // console.log("changeveh",ticketId);
    // const uri = process.env.DB_URI;
    // const client = new MongoClient(uri);
    // await client.connect();

    // const db = client.db("livedata");
    const collection = mongoose.connection.collection("hubapp_master_data");

    const ticketDetails = await Service_Request.find({ ticket_id: ticketId });
    // console.log("ticc",ticketDetails);
    if (ticketDetails.length == 0) {
      return false;
    }
    const vehicle = ticketDetails[0].vehicle;

    const isAnyServiceRequestPresent = checkForPendingServiceRequest(
      ticketId,
      vehicle
    );

    if (isAnyServiceRequestPresent) {
      return false;
    }

    const result = await collection.findOneAndUpdate(
      { "Vehicle No": vehicle },
      { $set: { Status: "RFD" } },
      { new: true }
    );

    if (Object.keys(result).length == 0) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

async function checkForPendingServiceRequest(ticketId, vehicle) {
  try {
    const serviceRequests = await Service_Request.find({
      vehicle: vehicle,
      "status.done.check": false,
    });
    // console.log("serv",serviceRequests);
    if (serviceRequests.length) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

module.exports = {
  changeVehicleStatus,
  change_Vehicle_Status_To_RFD,
};
