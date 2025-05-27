const { response } = require("express");
const Service_Request = require("../model/servicerequest");

const getNotAssignedRequests = async (req, res) => {
  const role = req.user.role;
  let location;

  //check if user provides seperate location
  if (req.body.location) {
    location = req.body.location;
  } else {
    location = req.user.location;
  }

  if (["Manager", "Inventory Manager", "Admin"].includes(role)) {
    const data = await Service_Request.find({
      $or: [
        { "assigned_to.check": false },
        { "assigned_to.check": true, "assigned_to.technician": null },
      ],
      location: location,
      date: { $gte: new Date("2025-01-01") },
    });
    let resultArr = [];
    data.map((ele) => {
      const {
        ticket_id,
        customer_name,
        vehicle,
        request_type,
        date,
        customer_mobile,
        location,
        assigned_to,
      } = ele;
      resultArr.push({
        ticketId: ticket_id,
        customerName: customer_name,
        customerMobile: customer_mobile,
        vehicleID: vehicle,
        type: request_type,
        date,
        location,
        technician: assigned_to.technician
          ? assigned_to.technician
          : "Not Assigned",
        status: "Not Assigned",
      });
    });
    res.json(resultArr);
  } else {
    res.sendStatus(401);
  }
};

const getStillInProgressRequests = async (req, res) => {
  const role = req.user.role;
  let location;

  //check if user provides seperate location
  if (req.body.location) {
    location = req.body.location;
  } else {
    location = req.user.location;
  }

  if (["Manager", "Inventory Manager", "Admin"].includes(role)) {
    let currentDate = new Date();
    let currentTime = currentDate.getTime();
    let last5Time = currentTime - 5 * 24 * 60 * 60 * 1000;
    let last5Date = new Date(last5Time);
    let resData = [];

    let data = await Service_Request.find({
      "status.in_progress.date_time": { $lte: new Date(last5Date) },
      "status.done.check": false,
      location: location,
      date: { $gte: new Date("2025-01-01") },
    });
    console.log(location);
    data.map((ele) => {
      const {
        ticket_id,
        customer_name,
        vehicleID: vehicle,
        request_type,
        date,
        customer_mobile,
        assigned_to,
        location,
      } = ele;
      resData.push({
        ticketId: ticket_id,
        customerName: customer_name,
        customerMobile: customer_mobile,
        vehicleID: vehicle,
        type: request_type,
        date,
        location,
        technician: assigned_to.technician
          ? assigned_to.technician
          : "Not Assigned",
        status: "In Progress",
      });
    });
    res.json(resData);
    // res.json(data);
  } else {
    res.sendStatus(401);
  }
};

const getNotDoneRequests = async (req, res) => {
  let location;

  //check if user provides seperate location
  if (req.body.location) {
    location = req.body.location;
  } else {
    location = req.user.location;
  }

  //check if user provides seperate location
  if (req.body.location) {
    location = req.body.location;
  } else {
    location = req.user.location;
  }
  const role = req.user.role;

  if (["Manager", "Inventory Manager", "Admin"].includes(role)) {
    let currentDate = new Date();
    // let currentTime = new Date(currentDate.getFullYear(),currentDate.getMonth(),currentDate.getDate()).getTime()
    let last5Time = currentDate - 5 * 24 * 60 * 60 * 1000;
    let last5Date = new Date(last5Time);
    let resData = [];
    let currentStatus = "";

    let data = await Service_Request.find({
      date: { $lte: new Date(last5Date) },
      "status.done.check": false,
      location: location,
      date: { $gte: new Date("2025-01-01") },
    });
    data.map((ele) => {
      const {
        ticket_id,
        customer_name,
        vehicleID: vehicle,
        request_type,
        date,
        customer_mobile,
        assigned_to,
        location,
        status,
      } = ele;

      if (assigned_to.check) {
        if (status.in_progress.check) {
          currentStatus = "In Progress";
        } else if (status.to_do.check) {
          currentStatus = "To Do";
        }
      } else {
        currentStatus = "Not Assigned";
      }

      resData.push({
        ticketId: ticket_id,
        customerName: customer_name,
        customerMobile: customer_mobile,
        vehicleID: vehicle,
        type: request_type,
        date,
        location,
        technician: assigned_to.technician
          ? assigned_to.technician
          : "Not Assigned",
        status: currentStatus,
      });
    });
    res.json(resData);
    // res.json(data);
  } else {
    res.sendStatus(401);
  }
};

module.exports = {
  getNotAssignedRequests,
  getStillInProgressRequests,
  getNotDoneRequests,
};
