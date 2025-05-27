const Rider = require("../model/rider");
const Service_Request = require("../model/servicerequest");
const User = require("../model/user");
// const {  currectTime } = dates.getDifferentTimePeriods();
const { getDifferentTimePeriods } = require("../utils/date");
const mysql = require("mysql2/promise");

const getAllServiceRequests = async (req, res) => {
  try {
    const service_Request = await Service_Request.find({});

    if (!service_Request) {
      return res.status(400).send("service_Request doesn't exit");
    }

    res.status(200).send(service_Request);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
};

const serviceRequestParts = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "Manager" && role !== "Technician") {
      return res.status(401).send("Not Authorized to perform this Operation");
    }

    const { id, used_count, unused_count, partId } = req.body;

    const serviceReq = await Service_Request.findById(id);

    if (!serviceReq) {
      return res.status(404).send("No service request found");
    }

    const partIndex = serviceReq.spare_parts.findIndex(
      (part) => part._id.toString() === partId
    );
    console.log(partIndex);
    if (partIndex === -1) {
      return res.status(404).send("Requested part not found");
    }

    // const isValid = serviceReq.requested_parts.every((part) => {
    //   const { count } = part;
    //   return (
    //     used_count > count ||
    //     unused_count > count ||
    //     used_count + unused_count > count
    //   );
    // });

    // if (isValid) {
    //   return res.status(400).send("Request part count exceed the limit.");
    // }
    const requestedPart = serviceReq.spare_parts[partIndex];
    if (used_count + unused_count > requestedPart.count) {
      return res.status(400).send("Request part count exceeds the limit.");
    }

    // const serviceRequest = await Service_Request.findByIdAndUpdate(
    //   id,
    //   {
    //     $set: {
    //       "requested_parts.$[elem].used_count": used_count,
    //       "requested_parts.$[elem].unused_count": unused_count,
    //     },
    //   },
    //   { new: true, arrayFilters: [{ "elem._id": { $exists: true } }] }
    // );

    // if (!serviceRequest) {
    //   return res.status(404).send("No service request found");
    // }
    serviceReq.spare_parts[partIndex].used_count = used_count;
    serviceReq.spare_parts[partIndex].unused_count = unused_count;

    // Save the updated service request
    const updatedServiceRequest = await serviceReq.save();

    res.status(200).send(updatedServiceRequest);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
};

const serviceRequestPartsImage = async (req, res) => {
  const { role } = req.user;
  const { partId, partImage, id } = req.body;
  console.log(partId, partImage, id);

  if (role != "Manager" && role != "Technician") {
    return res
      .status(401)
      .send("You are not authorized to perform this operation.");
  }
  try {
    const serviceRequest = await Service_Request.findById(id);
    if (!serviceRequest) {
      return res
        .status(404)
        .send("No service request found for ticket No." + ticket_id);
    }
    serviceRequest.spare_parts.forEach((part) => {
      if (part._id.toString() == partId) {
        part.part_image[partImage.name] = {
          image: partImage.image,
        };
      }
    });
    try {
      const updatedServiceRequest = await serviceRequest.save();
      res.status(200).send(updatedServiceRequest);
    } catch (error) {
      res.status(500).send(error.message);
      console.log(error.message, "inner error");
    }
  } catch (error) {
    res.status(500).send(error.message);
    console.log(error.message, "outer error");
  }
};

/*
const serviceRequestParts = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "Manager" && role !== "Technician") {
      return res.status(401).send("Not Authorized to perform this Operation");
    }

    const { id, used_count, unused_count } = req.body;

    const serviceReq = await Service_Request.findById(id);

    if (!serviceReq) {
      return res.status(404).send("No service request found");
    }

    const isValid = serviceReq.requested_parts.every((part) => {
      const { count } = part;
      return (
        used_count > count ||
        unused_count > count ||
        used_count + unused_count > count
      );
    });

    if (isValid) {
      return res.status(400).send("Request part count exceed the limit.");
    }

    const serviceRequest = await Service_Request.findByIdAndUpdate(
      id,
      {
        $set: {
          "requested_parts.$[elem].used_count": used_count,
          "requested_parts.$[elem].unused_count": unused_count,
        },
      },
      { new: true, arrayFilters: [{ "elem._id": { $exists: true } }] }
    );

    if (!serviceRequest) {
      return res.status(404).send("No service request found");
    }

    res.status(200).send(serviceRequest);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
};*/

const customerLinkUsedPart = async (req, res) => {
  try {
    const { role } = req.user;

    // validation of role with Manager & Employee
    if (role !== "Manager" && role !== "Employee") {
      return res.status(401).send("Not Authorized to perform this Operation");
    }

    const { mob_number, date } = req.body;

    let startDate, endDate;

    if (date) {
      const selectedDate = new Date(date);

      if (isNaN(selectedDate)) {
        return res.status(400).send("Invalid date format");
      }

      startDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1
      );
      endDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        0
      );
    } else {
      const currentDate = new Date();
      startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
    }

    // Custom condition: If startDate and endDate are not in the same month, set endDate to the end of the month
    if (startDate.getMonth() !== endDate.getMonth()) {
      endDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
    }

    console.log(startDate, endDate);

    let data;
    if (mob_number) {
      data = await serviceRequestsWithMobNumber(mob_number, startDate, endDate);
    } else {
      data = await serviceRequestsWithoutMobNumber(startDate, endDate);
    }

    res.status(200).send(data);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
};

const getTechnicianNames = async (location) => {
  const technicians = await User.find({ role: "Technician", location });
  const technicianNames = technicians.map((data) => {
    return data.name;
  });
  return technicianNames;
};

const ticketsPerHour = async (req, res) => {
  let location;

  //check if user provides seperate location
  if (req.body.location) {
    location = req.body.location;
  } else {
    location = req.user.location;
  }
  const technicianNames = await getTechnicianNames(location);
  let serviceRequests;
  let data;
  let tempTime;
  let requiredTime;
  if (!req.body.date) {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    tempTime = new Date(`${year}-${month}-${day}`).getTime();
    requiredTime = tempTime;
  } else {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    tempTime = new Date(req.body.date).getTime();
    requiredTime = tempTime + IST_OFFSET;
  }
  console.log(new Date(requiredTime), new Date(tempTime));
  let assignedTime;
  let ticket;
  let ticketData;
  let resultArr = [];
  for (let i = 0; i < technicianNames.length; i++) {
    ticketData = [
      {
        time: 9,
        ticket_id: [],
      },
      {
        time: 10,
        ticket_id: [],
      },
      {
        time: 11,
        ticket_id: [],
      },
      {
        time: 12,
        ticket_id: [],
      },
      {
        time: 1,
        ticket_id: [],
      },
      {
        time: 2,
        ticket_id: [],
      },
      {
        time: 3,
        ticket_id: [],
      },
      {
        time: 4,
        ticket_id: [],
      },
      {
        time: 5,
        ticket_id: [],
      },
      {
        time: 6,
        ticket_id: [],
      },
    ];
    serviceRequests = await Service_Request.find({
      "status.to_do.date_time": { $gte: new Date(requiredTime) },
      location,
      "assigned_to.technician": technicianNames[i],
    });
    data = serviceRequests.map((service) => {
      // const hours = (new Date(service.status.to_do.date_time).getTime() - todaysTime)/(1000*60*60);
      // ticketData.push({
      //   time: service.status.to_do.date_time.getUTCHours(),
      //   ticket_id: service.ticket_id,
      // });
      ticketData.forEach((ele) => {
        if (ele.time == service.status.to_do.date_time.getUTCHours())
          ele.ticket_id.push(service.ticket_id);
      });
    });
    resultArr.push({
      technician: technicianNames[i],
      ticketData,
    });
  }
  res.send(resultArr);
};

const addAppsRequest = async (req, res) => {
  try {
    const {
      status,
      type,
      odoMeter,
      customerName,
      phone,
      email,
      description,
      vehicle,
      comments,
    } = req.body.data;

    let location = "";
    let resultArr = [];

    if (!vehicle) {
      return res.status(400).send([{ message: "Vehicle is required" }]);
    }

    const pool = mysql.createPool({
      connectionLimit: process.env.MYSQL_CONNECTION_LIMIT,
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_ASSET_DATABASE, // Use the asset database as default
    });

    const [assetRows] = await pool.query(
      `SELECT ad.asset_id, ad.asset_code, ad.asset_type_id, ad.city_id, ad.state_id, ms.city_name, ms.city_code  FROM asset.asset_details ad 
      LEFT JOIN masters.ms_city ms ON ms.city_id = ad.city_id 
      WHERE asset_code = ?`,
      [vehicle.toUpperCase()]
    );

    if (assetRows.length === 0) {
      res.status(404).send([{ message: "Vehicle not found" }]);
      return;
    }
    if (assetRows[0].city_code == "NCR") {
      location = "NCR";
    } else {
      location = assetRows[0].city_name;
    }

    const { currectTime } = getDifferentTimePeriods();

    const serviceData = {
      customer_name: customerName,
      customer_mobile: phone,
      customer_email: email,
      vehicle,
      location,
      odometer_reading: odoMeter,
      request_type: type,
      issue_description: description,
      issue_type: [],
    };

    let record = new Service_Request(serviceData);

    let to_do = {
      check: true,
      date_time: currectTime,
    };

    record.status.to_do = to_do;

    let result = await record.save();
    result.ticket_id = `SR${result.ticket_no}`;
    let data = await result.save();
    let currentStatus = "";
    if (data["status"].done.check) {
      currentStatus = "Done";
    } else if (data["status"].to_do.check && data["status"].in_progress.check) {
      currentStatus = "In Progress";
    } else {
      currentStatus = "To Do";
    }

    resultArr.push({
      customer_name: data.customer_name,
      customer_mobile: data.customer_mobile,
      customer_email: data.customer_email,
      vehicle: data.vehicle,
      location: data.location,
      status: currentStatus,
      issue_description: data.issue_description,
      date: currectTime,
      ticket_id: data.ticket_id,
      ticket_no: data.ticket_no,
      request_type: data.request_type,
      odometer_reading: data.odometer_reading,
    });

    res.json({ message: "Service Request Added", data: resultArr });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error adding Apps Request", data: [] });
  }
};

const getServiceDataBasedOnQuery = async (req, res) => {
  const { startDate, endDate, openTicket, closeTicket, location } =
    req.body.data;
  try {
    let query = {};
    if (!startDate && !endDate && (!openTicket || !closeTicket)) {
      throw { code: 400, message: "One or more required fields are missing" };
    }
    if (openTicket) {
      query = {
        ...query,
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
      };
    }
    if (closeTicket) {
      if (openTicket) {
        query = {
          ...query,
          closure_date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        };
      }
    }
    if (location) {
      query = { ...query, location: location.toUpperCase() };
    }
    const response = await Service_Request.find(query, {
      ticket_id: 1,
      vehicle: 1,
      location: 1,
      customer_name: 1,
      customer_mobile: 1,
      customer_email: 1,
      hub: 1,
      date: 1,
      closure_date: 1,
      requested_parts: 1,
      spare_parts: 1,
    });

    const result = response.map((ticket) => {
      let spare_parts = "";
      let request_parts = "";
      ticket.spare_parts?.forEach((part) => {
        spare_parts =
          spare_parts +
          part.product_name +
          ` (${part.used_count}/${part.count})`;
      });

      ticket?.requested_parts?.forEach((part) => {
        request_parts =
          request_parts + part.product_name + ` (${part.count})` + ", ";
      });

      return {
        ticket_id: ticket.ticket_id,
        vehicle: ticket.vehicle,
        location: ticket.location,
        customer_name: ticket.customer_name,
        customer_mobile: ticket.customer_mobile,
        customer_email: ticket.customer_email,
        hub: ticket.hub,
        date: ticket.date,
        closure_date: ticket.closure_date,
        requested_parts: request_parts,
        spare_parts: spare_parts,
      };
    });
    res.json({ status: "OK", data: result });
  } catch (error) {
    console.log(error);
    const statusCode = error.code || 500;
    const message = error.message || "Something Went Wrong";
    res.status(statusCode).send(message);
  }
};

const deleteServiceData = async (req, res) => {
  try {
    const ticket_id = req.params.ticketId;
    if (!ticket_id) {
      throw { status: 400, message: "Ticket Id is required." };
    }

    console.log(ticket_id, "ticket");

    const result = await Service_Request.findOneAndDelete({
      ticket_id: ticket_id.toUpperCase().trim(),
    });

    console.log(result);

    if (result) {
      res.sendStatus(204);
    } else {
      throw { status: 404, message: "Service request not found" };
    }
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "SOmething went wrong";
    console.log(error);
    res.status(status).send({
      message,
    });
  }
};

module.exports = {
  serviceRequestParts,
  serviceRequestPartsImage,
  getAllServiceRequests,
  customerLinkUsedPart,
  ticketsPerHour,
  addAppsRequest,
  getServiceDataBasedOnQuery,
  deleteServiceData,
};

async function serviceRequestsWithMobNumber(mob_number, startDate, endDate) {
  const owner = await User.findOne({ mob_number });

  if (!owner) {
    return res.status(404).send("No owner found with this mobile number");
  }

  const rider = await Rider.findOne({ owner_mob: mob_number });

  if (!rider) {
    return res.status(404).send("No rider found with this mobile number");
  }

  const { vehicle_no } = rider;
  const serviceRequests = await Service_Request.aggregate([
    {
      $match: {
        vehicle: vehicle_no,
        "status.done.date_time": {
          $gte: startDate,
          $lte: endDate,
        },
        "status.done.check": true,
      },
    },
    {
      $project: {
        requested_parts: 1,
        // "status.done.date_time": 1,
        ticket_no: 1,
      },
    },
  ]);

  if (!serviceRequests) {
    return res
      .status(404)
      .send("No service requests found within the specified date range.");
  }

  const result = {
    owner_details: {
      email: owner.email,
      name: owner.name,
      mob_number: owner.mob_number,
    },
    rider_details: {
      email: rider.email,
      name: rider.name,
      mob_number: rider.mob_number,
    },
    servicerequest_details: serviceRequests,
  };

  return result;
}

async function serviceRequestsWithoutMobNumber(startDate, endDate) {
  const owners = await User.find({
    role: "Owner",
  });

  const riders = await Rider.find({
    owner_mob: { $in: owners.map((owner) => owner.mob_number) },
  });

  if (!riders) {
    return res.status(404).send("No rider found with this mobile number");
  }

  const vehicleNos = riders.map((rider) => rider.vehicle_no);

  const serviceRequests = await Service_Request.aggregate([
    {
      $match: {
        vehicle: { $in: vehicleNos },
        "status.done.check": true,
        "status.done.date_time": {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $project: {
        requested_parts: 1,
        ticket_no: 1,
        // "status.done.date_time": 1,
      },
    },
  ]);

  if (!serviceRequests) {
    return res
      .status(404)
      .send("No service requests found within the specified date range.");
  }

  const owner_details = owners.map((owner) => {
    return {
      name: owner.name,
      email: owner.email,
      mob_number: owner.mob_number,
    };
  });

  const rider_details = riders.map((rider) => {
    return {
      name: rider.name,
      email: rider.email,
      mob_number: rider.mob_number,
    };
  });

  const result = {
    owner_details,
    rider_details,
    servicerequest_details: serviceRequests,
  };

  return result;
}
