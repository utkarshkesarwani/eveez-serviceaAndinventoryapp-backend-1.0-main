const Service_Request = require("../model/servicerequest");
const jwt = require("jsonwebtoken");

//functions to get open, closed and all requests of a location
async function getOpenServiceRequest(req, res) {
  try {
    let openSRObj = [];
    let location = req.user.location;

    let Data = await Service_Request.find({
      $and: [
        {
          $or: [
            { "status.to_do.check": true },
            { "status.in_progress.check": true },
          ],
        },
        { "status.done.check": false },
        { location },
      ],
    });
    Data.map(async (ele) => {
      let ticketId = ele["ticket_id"];
      let vehicleID = ele["vehicle"];
      let date = ele["date"];
      let customerName = ele["customer_name"];
      let type = ele["request_type"];
      let status = "";
      let technician = "Not Assigned";

      if (ele["status"].to_do.check && ele["status"].in_progress.check) {
        status = "In Progress";
      } else {
        status = "To Do";
      }

      if (ele.assigned_to.check === true) {
        technician = ele.assigned_to.technician;
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

async function getClosedServiceRequest(req, res) {
  try {
    //differernce between time of GMT and IST, i.e 5hrs 30mins
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    let closedSRObj = [];
    let location = req.user.location;

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

    let Data = await Service_Request.find({
      "status.done.check": true,
      "status.done.date_time": { $gte: firstDay },
      location,
    });
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
      return new Date(b.date) - new Date(a.date);
    });

    res.status(200).send(sortedClosedServiceRequests);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}

async function getAllServiceRequest(req, res) {
  try {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    let allSRObj = [];
    let location ;

    //check if user provides seperate location
    if(req.body.data.location){
        location = req.body.data.location;
    }else{
      location = req.user.location;
    }

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

    //show date with unclosed tickets, and is the ticket is closed it should be closed in current month
    //simply in easy way we are just showing the data of closed whose done datetime is in current Month
    let Data = await Service_Request.find({
      $or: [
        { "status.done.check": false, location },
        {
          "status.done.check": true,
          "status.done.date_time": { $gte: firstDay },
          location,
        },
      ],
    }).sort({date: -1});
    Data.map(async (ele) => {
      let ticketId = ele["ticket_id"];
      let vehicleID = ele["vehicle"];
      let date = ele["date"];
      let customerName = ele["customer_name"];
      let type = ele["request_type"];
      let status = "";
      let technician = "Not Assigned";
      let hub = ele["hub"];

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
        hub,
      });
    });

    const sortedAllServiceRequests = allSRObj.sort((a, b) => {
      const statusOrder = { "To Do": 1, "In Progress": 2, Done: 3 };
      const statusA = a.status;
      const statusB = b.status;
      const statusOrderA = statusOrder[statusA];
      const statusOrderB = statusOrder[statusB];

      // If status is the same, sort by date
      // if (statusOrderA === statusOrderB) {
      //   return new Date(a.date) - new Date(b.date);
      // }

      // Otherwise, sort by status
      return statusOrderA - statusOrderB;
    });

    res.status(200).send(sortedAllServiceRequests);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}


async function getAllMISServiceRequest(req, res) {
try {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    let allSRObj = [];

    let GMTtoday = new Date();
    let today = new Date(GMTtoday.getTime() + IST_OFFSET);

    // Get first day of current month in IST
    const firstDayGMT = new Date();
    firstDayGMT.setDate(1);
    firstDayGMT.setHours(0, 0, 0, 0);
    let firstDay = new Date(firstDayGMT.getTime() + IST_OFFSET);

    // Modified query without location filter
    let Data = await Service_Request.find({
      $or: [
        { "status.done.check": false },
        {
          "status.done.check": true,
          "status.done.date_time": { $gte: firstDay }
        }
      ]
    }).sort({ date: -1 });

    Data.map(async (ele) => {
      let ticketId = ele["ticket_id"];
      let vehicleID = ele["vehicle"];
      let date = ele["date"];
      let customerName = ele["customer_name"];
      let type = ele["request_type"];
      let status = "";
      let technician = "Not Assigned";
      let hub = ele["hub"];

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
        hub,
      });
    });

    const sortedAllServiceRequests = allSRObj.sort((a, b) => {
      const statusOrder = { "To Do": 1, "In Progress": 2, Done: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

    res.status(200).send(sortedAllServiceRequests);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}




module.exports = {
  getOpenServiceRequest,
  getClosedServiceRequest,
  getAllServiceRequest,
  getAllMISServiceRequest,
};
