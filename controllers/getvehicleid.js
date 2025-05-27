const Rider = require("../model/rider");
const Service_Request = require("../model/servicerequest");
const User = require("../model/user");
const { vehicleDetails } = require("../model/vehDetails");

async function getVehIdforRider(req, res) {
  try {
    console.log();
    let mob_number = req.user.mob_number;
    // console.log(location);

    let RiderVehData = await Rider.find(
      { mob_number },
      { _id: 0, vehicle_no: 1 }
    );

    res.status(200).send(RiderVehData);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}

async function getVehIdforOwner(req, res) {
  try {
    console.log();
    let owner_mob_number = req.user.mob_number;
    console.log(owner_mob_number);

    let ownerVehData = await Rider.find(
      { owner_mob: owner_mob_number },
      { _id: 0, vehicle_no: 1 }
    );

    console.log(ownerVehData);
    const groupedVehicles = [];
    let row = [];

    ownerVehData.forEach((vehicle, index) => {
      // console.log(vehicle);
      row.push(vehicle.vehicle_no);
      if ((index + 1) % 3 === 0 || index === ownerVehData.length - 1) {
        groupedVehicles.push(row);
        row = [];
      }
    });
    res.status(200).send(groupedVehicles);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}

async function getAllVehId(req, res) {
  try {
    const role = req.user.role;
    let location = "";
    if (role == "Admin") location = req.body.data.location;
    else location = req.user.location;

    // Retrieve vehicle names from vehicleDetails
    const vehicleNames = await vehicleDetails
      .find({ Location: location }, { _id: 0, "Vehicle Name": 1 })
      .distinct("Vehicle Name");
    // Retrieve vehicle numbers from rider
    const riderVehicleNumbers = await Rider.find(
      { location: location },
      { _id: 0, vehicle_no: 1 }
    ).distinct("vehicle_no");

    // Combine and remove duplicates
    const allVehData = [...new Set([...vehicleNames, ...riderVehicleNumbers])];

    // console.log(allVehData,"allvehData");

    const groupedVehicles = [];
    let row = [];

    for (let index = 0; index < allVehData.length; index++) {
      const vehicle = allVehData[index];

      // console.log(vehicle);
      row.push(vehicle);
      if ((index + 1) % 3 === 0 || index === allVehData.length - 1) {
        groupedVehicles.push(row);
        row = [];
      }
    }
    res.status(200).send(groupedVehicles);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}

module.exports = {
  getVehIdforRider,
  getVehIdforOwner,
  getAllVehId,
};
