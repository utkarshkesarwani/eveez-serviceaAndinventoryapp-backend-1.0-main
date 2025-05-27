const Rider = require("../model/rider");
const Service_Request = require("../model/servicerequest");
const jwt = require("jsonwebtoken");

async function getOwnerOngoingServiceRequest(req, res) {
  try {
    let openSRObj = [];
    let location = req.user.location;
    let mob_number = req.user.mob_number;
    console.log(location);

    let riderForOwner = await Rider.find(
      { owner_mob: mob_number },
      { _id: 0, vehicle_no: 1 }
    );

    let allRidersVehicle = [];
    riderForOwner.forEach((vehicle) => {
      // console.log(vehicle);
      allRidersVehicle.push(vehicle.vehicle_no);
    });

    console.log(allRidersVehicle);

    let Data = await Service_Request.find({
      $and: [
        {
          $or: [
            { "status.to_do.check": true },
            { "status.in_progress.check": true },
          ],
        },
        { "status.done.check": false },
        { vehicle: { $in: allRidersVehicle } },
        { location },
      ],
    });

    console.log(Data, typeof Data);
    Data.map(async (ele) => {
      let ticketId = ele["ticket_id"];
      let vehicleID = ele["vehicle"];
      let date = ele["date"];
      let customerName = ele["customer_name"];
      let type = ele["request_type"];
      let status = "";
      let technician = "Not Assigned";

      if (ele.assigned_to.check === true) {
        console.log("here", ele.assigned_to.technician);
        technician = ele.assigned_to.technician;
      }

      if (ele["status"].to_do.check && ele["status"].in_progress.check) {
        status = "In Progress";
      } else {
        status = "To Do";
      }

      openSRObj.push({
        ticketId,
        vehicleID,
        customerName,
        type,
        date,
        status,
        technician,
      });
    });

    const sortedOpenServiceRequests = openSRObj.sort((a, b) => {
      // Sort by status, with "In To Do" first
      if (a.status === "To Do" && b.status !== "To Do") {
        return -1;
      } else if (a.status !== "To Do" && b.status === "To Do") {
        return 1;
      } else {
        // If status is the same, sort by date
        return new Date(a.date) - new Date(b.date);
      }
    });

    res.status(200).send({ sortedOpenServiceRequests });
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}

async function getOwnerCompleteServiceRequest(req, res) {
  try {
    let closedSRObj = [];
    let location = req.user.location;
    let mob_number = req.user.mob_number;
    console.log(location);

    let riderForOwner = await Rider.find(
      { owner_mob: mob_number },
      { _id: 0, vehicle_no: 1 }
    );

    let allRidersVehicle = [];
    riderForOwner.forEach((vehicle) => {
      // console.log(vehicle);
      allRidersVehicle.push(vehicle.vehicle_no);
    });

    let Data = await Service_Request.find({
      "status.done.check": true,
      vehicle: { $in: allRidersVehicle },
      location,
    });

    // console.log(Data, typeof Data);
    Data.map(async (ele) => {
      let ticketId = ele["ticket_id"];
      let vehicleID = ele["vehicle"];
      let date = ele["date"];
      let customerName = ele["customer_name"];
      let type = ele["request_type"];
      let status = "Done";
      let technician = ele.assigned_to.technician;

      closedSRObj.push({
        ticketId,
        vehicleID,
        customerName,
        type,
        date,
        status,
        technician,
      });
    });

    const sortedClosedServiceRequests = closedSRObj.sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });

    res.status(200).send(sortedClosedServiceRequests);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}

async function getOwnerAllServiceRequest(req, res) {
  try {
    let allSRObj = [];
    let location = req.user.location;
    let mob_number = req.user.mob_number;
    console.log(location);

    let riderForOwner = await Rider.find(
      { owner_mob: mob_number },
      { _id: 0, vehicle_no: 1 }
    );

    let allRidersVehicle = [];
    riderForOwner.forEach((vehicle) => {
      // console.log(vehicle);
      allRidersVehicle.push(vehicle.vehicle_no);
    });

    console.log(allRidersVehicle);

    let Data = await Service_Request.find({
      vehicle: { $in: allRidersVehicle },
      location,
    });

    console.log(Data, typeof Data);
    Data.map(async (ele) => {
      let ticketId = ele["ticket_id"];
      let vehicleID = ele["vehicle"];
      let date = ele["date"];
      let customerName = ele["customer_name"];
      let type = ele["request_type"];
      let status = "";
      let technician = "Not Assigned";

      if (ele.assigned_to.check === true) {
        technician = ele.assigned_to.technician;
      }

      if (ele["status"].done.check) {
        status = "Done";
      } else if (ele["status"].to_do.check && ele["status"].in_progress.check) {
        status = "In Progress";
      } else {
        status = "To Do";
      }

      allSRObj.push({
        ticketId,
        vehicleID,
        customerName,
        type,
        date,
        status,
        technician,
      });
    });

    const sortedAllServiceRequests = allSRObj.sort((a, b) => {
      const statusOrder = { "To Do": 1, "In Progress": 2, Done: 3 };
      const statusA = a.status;
      const statusB = b.status;
      const statusOrderA = statusOrder[statusA];
      const statusOrderB = statusOrder[statusB];

      // If status is the same, sort by date
      if (statusOrderA === statusOrderB) {
        return new Date(a.date) - new Date(b.date);
      }

      // Otherwise, sort by status
      return statusOrderA - statusOrderB;
    });

    res.status(200).send(sortedAllServiceRequests);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}

//Rider View Ongoing, complete SRs
async function getRiderOngoingServiceRequest(req, res) {
  try {
    let openSRObj = [];
    let location = req.user.location;
    let vehicle_no = req.user.vehicle_no;
    console.log("rider open", location, vehicle_no);

    let Data = await Service_Request.find({
      $and: [
        {
          $or: [
            { "status.to_do.check": true },
            { "status.in_progress.check": true },
          ],
        },
        { "status.done.check": false },
        { vehicle: vehicle_no },
        { location },
      ],
    });

    // console.log(Data, typeof Data);
    Data.map(async (ele) => {
      let ticketId = ele["ticket_id"];
      let vehicleID = ele["vehicle"];
      let date = ele["date"];
      let customerName = ele["customer_name"];
      let type = ele["request_type"];
      let status = "";
      let technician = "Not Assigned";

      if (ele.assigned_to.check === true) {
        console.log("here", ele.assigned_to.technician);
        technician = ele.assigned_to.technician;
      }

      if (ele["status"].to_do.check && ele["status"].in_progress.check) {
        status = "In Progress";
      } else {
        status = "To Do";
      }

      openSRObj.push({
        ticketId,
        vehicleID,
        customerName,
        type,
        date,
        status,
        technician,
      });
    });

    const sortedOpenServiceRequests = openSRObj.sort((a, b) => {
      // Sort by status, with "In To Do" first
      if (a.status === "To Do" && b.status !== "To Do") {
        return -1;
      } else if (a.status !== "To Do" && b.status === "To Do") {
        return 1;
      } else {
        // If status is the same, sort by date
        return new Date(a.date) - new Date(b.date);
      }
    });

    res.status(200).send({ sortedOpenServiceRequests });
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}

async function getRiderCompleteServiceRequest(req, res) {
  try {
    let closedSRObj = [];
    let location = req.user.location;
    let vehicle_no = req.user.vehicle_no;
    console.log(location);

    let Data = await Service_Request.find({
      "status.done.check": true,
      vehicle: vehicle_no,
      location,
    });

    // console.log(Data, typeof Data);
    Data.map(async (ele) => {
      let ticketId = ele["ticket_id"];
      let vehicleID = ele["vehicle"];
      let date = ele["date"];
      let customerName = ele["customer_name"];
      let type = ele["request_type"];
      let status = "Done";
      let technician = ele.assigned_to.technician;

      closedSRObj.push({
        ticketId,
        vehicleID,
        customerName,
        type,
        date,
        status,
        technician,
      });
    });

    const sortedClosedServiceRequests = closedSRObj.sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });

    res.status(200).send(sortedClosedServiceRequests);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}

async function getRiderAllServiceRequest(req, res) {
  try {
    let allSRObj = [];
    let location = req.user.location;
    let vehicle_no = req.user.vehicle_no;
    console.log(location);

    let Data = await Service_Request.find({
      vehicle: vehicle_no,
    });

    // console.log(Data, typeof Data);
    Data.map(async (ele) => {
      let ticketId = ele["ticket_id"];
      let vehicleID = ele["vehicle"];
      let date = ele["date"];
      let customerName = ele["customer_name"];
      let type = ele["request_type"];
      let status = "";
      let technician = "Not Assigned";

      if (ele.assigned_to.check === true) {
        console.log("here", ele.assigned_to.technician);
        technician = ele.assigned_to.technician;
      }

      if (ele["status"].done.check) {
        status = "Done";
      } else if (ele["status"].to_do.check && ele["status"].in_progress.check) {
        status = "In Progress";
      } else {
        status = "To Do";
      }

      allSRObj.push({
        ticketId,
        vehicleID,
        customerName,
        type,
        date,
        status,
        technician,
      });
    });

    const sortedAllServiceRequests = allSRObj.sort((a, b) => {
      const statusOrder = { "To Do": 1, "In Progress": 2, Done: 3 };
      const statusA = a.status;
      const statusB = b.status;
      const statusOrderA = statusOrder[statusA];
      const statusOrderB = statusOrder[statusB];

      // If status is the same, sort by date
      if (statusOrderA === statusOrderB) {
        return new Date(a.date) - new Date(b.date);
      }

      // Otherwise, sort by status
      return statusOrderA - statusOrderB;
    });

    res.status(200).send(sortedAllServiceRequests);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}

//technician assigned service requests
async function getTechnicianOpenServiceRequest(req, res) {
  try {
    let openSRObj = [];
    let location = req.user.location;
    let Technicianname = req.user.name;
    console.log(" open", location, Technicianname);

    let Data = await Service_Request.find({
      $and: [
        {
          $or: [
            { "status.to_do.check": true },
            { "status.in_progress.check": true },
          ],
        },
        { "status.done.check": false },
        { "assigned_to.technician": Technicianname },
        { location },
      ],
    });

    console.log(Data, typeof Data);
    Data.map(async (ele) => {
      let ticketId = ele["ticket_id"];
      let vehicleID = ele["vehicle"];
      let date = ele["date"];
      let customerName = ele["customer_name"];
      let type = ele["request_type"];
      let status = "";
      let technician = "Not Assigned";

      if (ele.assigned_to.check === true) {
        console.log("here", ele.assigned_to.technician);
        technician = ele.assigned_to.technician;
      }

      if (ele["status"].to_do.check && ele["status"].in_progress.check) {
        status = "In Progress";
      } else {
        status = "To Do";
      }

      openSRObj.push({
        ticketId,
        vehicleID,
        customerName,
        type,
        date,
        status,
        technician,
      });
    });

    const sortedOpenServiceRequests = openSRObj.sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });

    res.status(200).send({ sortedOpenServiceRequests });
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}

async function getTechnicianCompleteServiceRequest(req, res) {
  try {
    //differernce between time of GMT and IST, i.e 5hrs 30mins
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    let closedSRObj = [];
    let location = req.user.location;
    let Technicianname = req.user.name;

    let GMTtoday = new Date();
    let today = new Date(GMTtoday.getTime() + IST_OFFSET);

    // let last30DaysGMT = new Date();
    // last30DaysGMT.setDate(last30DaysGMT.getDate() - 30);
    // const last30Days = new Date(last30DaysGMT.getTime() + IST_OFFSET);

    //code to get first day of current Month
    const firstDayGMT = new Date();
    // Set the date to the 1st day of the current month
    firstDayGMT.setDate(1);
    firstDayGMT.setHours(0, 0, 0, 0);

    //convert GMT firstDay Time to IST
    let firstDay = new Date(firstDayGMT.getTime() + IST_OFFSET);

    console.log(location, today, firstDay);

    let Data = await Service_Request.find({
      "status.done.check": true,
      "status.done.date_time": { $gte: firstDay },
      "assigned_to.technician": Technicianname,
      location,
    });

    // console.log(Data, typeof Data);
    Data.map(async (ele) => {
      let ticketId = ele["ticket_id"];
      let vehicleID = ele["vehicle"];
      let date = ele["date"];
      let customerName = ele["customer_name"];
      let type = ele["request_type"];
      let status = "Done";
      let technician = ele.assigned_to.technician;

      closedSRObj.push({
        ticketId,
        vehicleID,
        customerName,
        type,
        date,
        status,
        technician,
      });
    });

    const sortedClosedServiceRequests = closedSRObj.sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });

    res.status(200).send(sortedClosedServiceRequests);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}

async function getTechnicianAllServiceRequest(req, res) {
  try {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    let allSRObj = [];
    let location = req.user.location;
    let Technicianname = req.user.name;

    let GMTtoday = new Date();
    let today = new Date(GMTtoday.getTime() + IST_OFFSET);

    // let last30DaysGMT = new Date();
    // last30DaysGMT.setDate(last30DaysGMT.getDate() - 30);
    // const last30Days = new Date(last30DaysGMT.getTime() + IST_OFFSET);

    //code to get first day of current Month
    const firstDayGMT = new Date();
    // Set the date to the 1st day of the current month
    firstDayGMT.setDate(1);
    firstDayGMT.setHours(0, 0, 0, 0);

    //convert GMT firstDay Time to IST
    let firstDay = new Date(firstDayGMT.getTime() + IST_OFFSET);

    console.log(location, today, firstDay);

    let Data = await Service_Request.find({
      $or: [
        {
          "status.done.check": false,
          location,
          "assigned_to.technician": Technicianname,
        },
        {
          "status.done.check": true,
          "status.done.date_time": { $gte: firstDay },
          location,
          "assigned_to.technician": Technicianname,
        },
      ],
    });

    // console.log(Data, typeof Data);
    Data.map(async (ele) => {
      let ticketId = ele["ticket_id"];
      let vehicleID = ele["vehicle"];
      let date = ele["date"];
      let customerName = ele["customer_name"];
      let type = ele["request_type"];
      let status = "";
      let technician = "Not Assigned";

      if (ele.assigned_to.check === true) {
        // console.log("here", ele.assigned_to.technician);
        technician = ele.assigned_to.technician;
      }

      if (ele["status"].done.check) {
        status = "Done";
      } else if (ele["status"].to_do.check && ele["status"].in_progress.check) {
        status = "In Progress";
      } else {
        status = "To Do";
      }

      allSRObj.push({
        ticketId,
        vehicleID,
        customerName,
        type,
        date,
        status,
        technician,
      });
    });

    const sortedAllServiceRequests = allSRObj.sort((a, b) => {
      const statusOrder = { "To Do": 1, "In Progress": 2, Done: 3 };
      const statusA = a.status;
      const statusB = b.status;
      const statusOrderA = statusOrder[statusA];
      const statusOrderB = statusOrder[statusB];

      // If status is the same, sort by date
      if (statusOrderA === statusOrderB) {
        return new Date(a.date) - new Date(b.date);
      }

      // Otherwise, sort by status
      return statusOrderA - statusOrderB;
    });

    res.status(200).send(sortedAllServiceRequests);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}

module.exports = {
  getOwnerOngoingServiceRequest,
  getOwnerCompleteServiceRequest,
  getOwnerAllServiceRequest,
  getRiderOngoingServiceRequest,
  getRiderCompleteServiceRequest,
  getRiderAllServiceRequest,
  getTechnicianOpenServiceRequest,
  getTechnicianCompleteServiceRequest,
  getTechnicianAllServiceRequest,
};
