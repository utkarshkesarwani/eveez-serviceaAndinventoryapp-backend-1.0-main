const User = require("../model/user");
const Service_Request = require("../model/servicerequest");
const { extrakmsDetails } = require("../model/extrakmsDetails");
const Rider = require("../model/rider");
const { vehicleDetails } = require("../model/vehDetails");
const { tripData } = require("../model/tripdata");
const dates = require("../utils/date");

const { startTime, currectTime, lastWeek, currentMonth, lastThirtyDays } =
  dates.getDifferentTimePeriods();

//service request data per technican for manager view
async function getServiceRecords(req, res) {
  try {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    let result = [];

    let location;
    if (req.body.location) {
      location = req.body.location;
    } else {
      location = req.user.location;
    }

    const techniciansList = await User.find(
      { role: "Technician", location },
      { _id: 1, name: 1 }
    );

    let last90DaysGMT = new Date();
    last90DaysGMT.setDate(last90DaysGMT.getDate() - 90);
    const last90Days = new Date(last90DaysGMT.getTime() + 5.5 * 60 * 60 * 1000);

    let todaysDate = new Date();
    todaysDate.setHours(0, 0, 0, 0);
    todaysDate = new Date(todaysDate.getTime() + IST_OFFSET);

    console.log(todaysDate);

    // Loop through each technician
    for (let i = 0; i < techniciansList.length; i++) {
      const technician = techniciansList[i];

      const todayServiceRequests = await Service_Request.find({
        $or: [
          {
            "assigned_to.technician": technician.name,
          },
          {
            "assigned_to.id": technician._id,
          },
        ],
        "status.done.check": true,
        "status.done.date_time": { $gte: todaysDate },
      });

      console.log(todayServiceRequests);

      const weeklyServiceRequests = await Service_Request.find({
        $or: [
          {
            "assigned_to.technician": technician.name,
          },
          {
            "assigned_to.id": technician._id,
          },
        ],
        "status.done.check": true,
        "status.done.date_time": { $gte: lastWeek, $lte: startTime },
      });

      const monthlyServiceRequests = await Service_Request.find({
        $or: [
          {
            "assigned_to.technician": technician.name,
          },
          {
            "assigned_to.id": technician._id,
          },
        ],
        "status.done.check": true,
        "status.done.date_time": { $gte: lastThirtyDays, $lte: startTime },
      });

      const incompleteServiceRequests = await Service_Request.find({
        $or: [
          {
            "assigned_to.technician": technician.name,
          },
          {
            "assigned_to.id": technician._id,
          },
        ],
        "status.done.check": false,
        // date: { $gte: last90Days, $lte: today },
      });

      const completeServiceRequests = await Service_Request.find({
        $or: [
          {
            "assigned_to.technician": technician.name,
          },
          {
            "assigned_to.id": technician._id,
          },
        ],
        "status.done.check": true,
        // date: { $gte: last90Days, $lte: today },
      });

      result.push({
        name: technician.name,
        id: technician.id,
        incomplete: incompleteServiceRequests.length,
        complete: completeServiceRequests.length,
        weekly: weeklyServiceRequests.length,
        monthly: monthlyServiceRequests.length,
        today: todayServiceRequests?.length,
      });
    }

    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(400).send("Error getting service requests by technician");
  }
}

//for rider view
async function getRiderServiceRecords(req, res) {
  try {
    let distanceRange = { SH: 2000, SS: 3300, FR: 2500, SF: 3500 };
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    let result = [];

    let location = req.user.location;

    let vehicle = req.user.vehicle_no;

    // Get weekly and monthly done service requests for the technician
    const GMTtoday = new Date();

    //IST Today
    let today = new Date(GMTtoday.getTime() + 5.5 * 60 * 60 * 1000);

    let last90DaysGMT = new Date();
    last90DaysGMT.setDate(last90DaysGMT.getDate() - 90);
    const last90Days = new Date(last90DaysGMT.getTime() + IST_OFFSET);

    const startOfWeekGMT = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay()
    );

    const startOfWeek = new Date(
      startOfWeekGMT.getTime() + 5.5 * 60 * 60 * 1000
    );

    const endOfWeekGMT = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + (6 - today.getDay())
    );

    const endOfWeek = new Date(endOfWeekGMT.getTime() + 5.5 * 60 * 60 * 1000);

    console.log(startOfWeek, endOfWeek);

    const startOfMonthGMT = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfMonth = new Date(startOfMonthGMT.getTime() + IST_OFFSET);

    const endOfMonthGMT = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    );
    const endOfMonth = new Date(endOfMonthGMT.getTime() + IST_OFFSET);

    console.log(startOfMonth, endOfMonth);

    const weeklyBookedServiceRequests = await Service_Request.find({
      vehicle,
      "status.done.date_time": { $gte: startOfWeek, $lt: endOfWeek },
    });

    const weeklyDoneServiceRequests = await Service_Request.find({
      vehicle,
      "status.done.check": true,
      "status.done.date_time": { $gte: startOfWeek, $lt: endOfWeek },
    });

    const monthlyBookedServiceRequests = await Service_Request.find({
      vehicle,
      "status.done.date_time": { $gte: startOfMonth, $lt: endOfMonth },
    });

    const monthlyDoneServiceRequests = await Service_Request.find({
      vehicle,
      "status.done.check": true,
      "status.done.date_time": { $gte: startOfMonth, $lt: endOfMonth },
    });

    const incompleteServiceRequests = await Service_Request.find({
      vehicle,
      "status.done.check": false,
    });

    const completeServiceRequests = await Service_Request.find({
      vehicle,
      "status.done.check": true,
    });

    let plan = vehicle.slice(3, 5);

    let Month = today.getMonth() + 1;
    let Year = today.getFullYear();

    console.log(Month, Year);
    vehicleKMSData = await extrakmsDetails.find(
      {
        AssetName: vehicle,
        Month,
        Year,
      },
      { _id: 0, TotalDistance: 1 }
    );

    //steps to calculate FUP
    let fupPercent = "N/A";
    let totalDistance;
    let monthlyRange;
    if (distanceRange[plan] !== undefined) {
      monthlyRange = distanceRange[plan];
    }

    if (vehicleKMSData.length > 0) {
      totalDistance = vehicleKMSData[0].TotalDistance;
      if (totalDistance) {
        totalDistance = Number(totalDistance.toFixed(2));
      }

      fupPercent = Number(((totalDistance / monthlyRange) * 100).toFixed(2));
    }

    console.log(vehicleKMSData);

    let tripDataResult = [];
    let serviceRequestData = await Service_Request.find(
      {
        vehicle,
        date: { $lte: today, $gt: last90Days },
      },
      {
        vehicle: 1,
        ticket_id: 1,
        date: 1,
        closure_date: 1,
      }
    )
      .sort({ date: 1 })
      .limit(6);

    console.log(serviceRequestData);

    let imeis = await vehicleDetails
      .find(
        {
          "Vehicle Name": vehicle,
        },
        { "Vehicle Name": 1, IMEI: 1 }
      )
      .lean();

    console.log(imeis, "imeis", serviceRequestData.length);
    for (let i = 0; i < serviceRequestData.length - 1; i++) {
      let totaldistance = 0;
      let totalTrips = 0;

      const ticket1 = serviceRequestData[i];
      const ticket2 = serviceRequestData[i + 1];

      const date1 = ticket1.date;
      const date2 = ticket2.date;

      // Calculate the time difference in milliseconds
      const timeDiff = date2.getTime() - date1.getTime();

      // Convert milliseconds to days
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      console.log(date1, date2, imeis);

      let tripDataDetails = await tripData.find({
        imeino: { $in: imeis.map((i) => i.IMEI) },
        startdatetime: { $gte: date1 },
        enddatetime: { $lte: date2 },
      });

      console.log(tripDataDetails);

      totaldistance += tripDataDetails.reduce(
        (sum, trip) => sum + trip.distanceinkm,
        0
      );
      totalTrips += tripDataDetails.length;

      tripDataResult.push({
        ticket1: ticket1.ticket_id,
        ticket2: ticket2.ticket_id,
        date1,
        date2,
        totalDays: daysDiff - 1,
        totaldistance,
        totalTrips,
      });
      console.log(tripDataDetails);
    }

    result.push({
      vehicle,
      name: req.user.name,
      complete: completeServiceRequests.length,
      incomplete: incompleteServiceRequests.length,
      weeklyBooked: weeklyBookedServiceRequests.length,
      weeklyDone: weeklyDoneServiceRequests.length,
      monthlyBooked: monthlyBookedServiceRequests.length,
      monthlyDone: monthlyDoneServiceRequests.length,
      plan,
      fupPercent,
      totalDistance,
      tripDataResult,
    });

    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(400).send("Error getting service records of Rider");
  }
}

//for owner view
async function getOwnerServiceRecords(req, res) {
  try {
    let distanceRange = { SH: 2000, SS: 3300, FR: 2500, SF: 3500 };
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    let riderDetails = [];

    let location = req.user.location;
    let mob_number = req.user.mob_number;

    // Get weekly and monthly done service requests for the technician
    const GMTtoday = new Date();
    //IST Today
    let today = new Date(GMTtoday.getTime() + 5.5 * 60 * 60 * 1000);

    let last90DaysGMT = new Date();
    last90DaysGMT.setDate(last90DaysGMT.getDate() - 90);
    const last90Days = new Date(last90DaysGMT.getTime() + IST_OFFSET);

    let Month = today.getMonth() + 1;
    let Year = today.getFullYear();

    const startOfWeekGMT = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay()
    );
    const startOfWeek = new Date(
      startOfWeekGMT.getTime() + 5.5 * 60 * 60 * 1000
    );

    const endOfWeekGMT = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + (6 - today.getDay())
    );
    const endOfWeek = new Date(endOfWeekGMT.getTime() + 5.5 * 60 * 60 * 1000);

    console.log(startOfWeek, endOfWeek);

    const startOfMonthGMT = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfMonth = new Date(startOfMonthGMT.getTime() + IST_OFFSET);

    const endOfMonthGMT = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    );
    const endOfMonth = new Date(endOfMonthGMT.getTime() + IST_OFFSET);

    console.log(startOfMonth, endOfMonth);

    //get riders subscribed by logged in owner
    let riderForOwner = await Rider.find(
      { owner_mob: mob_number },
      { _id: 0, vehicle_no: 1, name: 1 }
    );

    // console.log(riderForOwner);

    let allRidersVehicle = [];
    riderForOwner.forEach((vehicle) => {
      // console.log(vehicle);
      allRidersVehicle.push(vehicle.vehicle_no);
    });

    const incompleteServiceRequests = await Service_Request.find({
      vehicle: { $in: allRidersVehicle },
      "status.done.check": false,
      date: { gte: last90Days },
    });

    const completeServiceRequests = await Service_Request.find({
      vehicle: { $in: allRidersVehicle },
      "status.done.check": true,
      date: { gte: last90Days },
    });

    const weeklyBookedServiceRequests = await Service_Request.find({
      vehicle: { $in: allRidersVehicle },
      date: { $gte: startOfWeek, $lt: endOfWeek },
    });

    const weeklyDoneServiceRequests = await Service_Request.find({
      vehicle: { $in: allRidersVehicle },
      "status.done.check": true,
      "status.done.date_time": { $gte: startOfWeek, $lt: endOfWeek },
    });

    const monthlyBookedServiceRequests = await Service_Request.find({
      vehicle: { $in: allRidersVehicle },
      date: { $gte: startOfMonth, $lt: endOfMonth },
    });

    const monthlyDoneServiceRequests = await Service_Request.find({
      vehicle: { $in: allRidersVehicle },
      "status.done.check": true,
      "status.done.date_time": { $gte: startOfMonth, $lt: endOfMonth },
    });

    let result = [];
    result.push({
      complete: completeServiceRequests.length,
      incomplete: incompleteServiceRequests.length,
      weeklyBooked: weeklyBookedServiceRequests.length,
      weeklyDone: weeklyDoneServiceRequests.length,
      monthlyBooked: monthlyBookedServiceRequests.length,
      monthlyDone: monthlyDoneServiceRequests.length,
    });

    for (let i = 0; i < riderForOwner.length; i++) {
      let vehicle = riderForOwner[i].vehicle_no;
      let rider = riderForOwner[i].name;

      const weeklyBookedServiceRequests = await Service_Request.find({
        vehicle,
        "status.done.date_time": { $gte: startOfWeek, $lt: endOfWeek },
      });

      const weeklyDoneServiceRequests = await Service_Request.find({
        vehicle,
        "status.done.check": true,
        "status.done.date_time": { $gte: startOfWeek, $lt: endOfWeek },
      });

      const monthlyBookedServiceRequests = await Service_Request.find({
        vehicle,
        "status.done.date_time": { $gte: startOfMonth, $lt: endOfMonth },
      });

      const monthlyDoneServiceRequests = await Service_Request.find({
        vehicle,
        "status.done.check": true,
        "status.done.date_time": { $gte: startOfMonth, $lt: endOfMonth },
      });

      const incompleteServiceRequests = await Service_Request.find({
        vehicle,
        "status.done.check": false,
      });

      const completeServiceRequests = await Service_Request.find({
        vehicle,
        "status.done.check": true,
      });

      let plan = vehicle.slice(3, 5);

      console.log(Month, Year);
      vehicleKMSData = await extrakmsDetails.find(
        {
          AssetName: vehicle,
          Month,
          Year,
        },
        { _id: 0, TotalDistance: 1 }
      );

      //steps to calculate FUP
      let fupPercent = "N/A";
      let totalDistance;
      let monthlyRange;
      if (distanceRange[plan] !== undefined) {
        monthlyRange = distanceRange[plan];
      }

      if (vehicleKMSData.length > 0) {
        totalDistance = vehicleKMSData[0].TotalDistance;
        if (totalDistance) {
          totalDistance = Number(totalDistance.toFixed(2));
        }

        fupPercent = Number(((totalDistance / monthlyRange) * 100).toFixed(2));
      }
      console.log(vehicleKMSData);

      let tripDataResult = [];
      let serviceRequestData = await Service_Request.find(
        {
          vehicle,
          date: { $lte: today, $gt: last90Days },
        },
        {
          vehicle: 1,
          ticket_id: 1,
          date: 1,
          closure_date: 1,
        }
      )
        .sort({ date: 1 })
        .limit(6);

      // console.log(serviceRequestData);

      let imeis = await vehicleDetails
        .find(
          {
            "Vehicle Name": vehicle,
          },
          { "Vehicle Name": 1, IMEI: 1 }
        )
        .lean();

      console.log(imeis, "imeis", serviceRequestData.length);

      for (let i = 0; i < serviceRequestData.length - 1; i++) {
        let totaldistance = 0;
        let totalTrips = 0;

        const ticket1 = serviceRequestData[i];
        const ticket2 = serviceRequestData[i + 1];

        const date1 = ticket1.date;
        const date2 = ticket2.date;

        // console.log(date1, date2, imeis);

        let tripDataDetails = await tripData.find({
          imeino: { $in: imeis.map((i) => i.IMEI) },
          startdatetime: { $gte: date1 },
          enddatetime: { $lte: date2 },
        });

        // console.log(tripDataDetails);

        totaldistance += tripDataDetails.reduce(
          (sum, trip) => sum + trip.distanceinkm,
          0
        );
        totalTrips += tripDataDetails.length;

        tripDataResult.push({
          ticket1: ticket1.ticket_id,
          ticket2: ticket2.ticket_id,
          date1,
          date2,
          totaldistance,
          totalTrips,
        });
        console.log(tripDataResult);
      }

      riderDetails.push({
        vehicle,
        rider,
        complete: completeServiceRequests.length,
        incomplete: incompleteServiceRequests.length,
        weeklyBooked: weeklyBookedServiceRequests.length,
        weeklyDone: weeklyDoneServiceRequests.length,
        monthlyBooked: monthlyBookedServiceRequests.length,
        monthlyDone: monthlyDoneServiceRequests.length,
        plan,
        fupPercent,
        totalDistance,
        tripDataResult,
      });
    }

    result.push({ data: riderDetails });
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(400).send("Error getting service records of Rider");
  }
}

//for technician view
async function getTechnicianServiceRecords(req, res) {
  try {
    // const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    let technician = req.user.name;
    let technicianId = req.user._id;
    let location = req.user.location;
    let result = [];
    let Data = [];

    let last90DaysGMT = new Date();
    last90DaysGMT.setDate(last90DaysGMT.getDate() - 90);
    const last90Days = new Date(last90DaysGMT.getTime() + 5.5 * 60 * 60 * 1000);

    console.log(startTime, lastThirtyDays);

    let technicianData = await Service_Request.find({
      $or: [
        {
          "assigned_to.technician": technician,
        },
        {
          "assigned_to.id": technicianId,
        },
      ],
      date: { $lte: startTime, $gt: last90Days },
    });

    technicianData.map(async (ele) => {
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

      Data.push({
        ticketId,
        vehicleID,
        customerName,
        type,
        date,
        status,
        technician,
      });
    });

    const sortedData = Data.sort((a, b) => {
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

    const incompleteServiceRequests = await Service_Request.find({
      $or: [
        {
          "assigned_to.technician": technician,
        },
        {
          "assigned_to.id": technicianId,
        },
      ],
      "status.done.check": false,
      date: { $lte: startTime, $gt: last90Days },
    });

    const completeServiceRequests = await Service_Request.find({
      $or: [
        {
          "assigned_to.technician": technician,
        },
        {
          "assigned_to.id": technicianId,
        },
      ],
      "status.done.check": true,
      date: { $lte: startTime, $gt: last90Days },
    });

    const weeklyBookedServiceRequests = await Service_Request.find({
      $or: [
        {
          "assigned_to.technician": technician,
        },
        {
          "assigned_to.id": technicianId,
        },
      ],
      date: { $gte: lastWeek, $lt: startTime },
    });

    const weeklyDoneServiceRequests = await Service_Request.find({
      $or: [
        {
          "assigned_to.technician": technician,
        },
        {
          "assigned_to.id": technicianId,
        },
      ],
      "status.done.check": true,
      "status.done.date_time": { $gte: lastWeek, $lt: startTime },
    });

    const monthlyBookedServiceRequests = await Service_Request.find({
      $or: [
        {
          "assigned_to.technician": technician,
        },
        {
          "assigned_to.id": technicianId,
        },
      ],
      date: { $gte: lastThirtyDays, $lt: startTime },
    });

    const monthlyDoneServiceRequests = await Service_Request.find({
      $or: [
        {
          "assigned_to.technician": technician,
        },
        {
          "assigned_to.id": technicianId,
        },
      ],
      "status.done.check": true,
      "status.done.date_time": { $gte: lastThirtyDays, $lt: startTime },
    });

    result.push({
      incomplete: incompleteServiceRequests.length,
      complete: completeServiceRequests.length,
      weeklyBooked: weeklyBookedServiceRequests.length,
      weeklyDone: weeklyDoneServiceRequests.length,
      monthlyBooked: monthlyBookedServiceRequests.length,
      monthlyDone: monthlyDoneServiceRequests.length,
    });

    result.push({ data: sortedData });

    res.status(200).send(result);

    // return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(`Error: ${error}`);
  }
}

//for emplyee view
async function getEmployeeServiceRecords(req, res) {
  try {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    let location = req.user.location;
    let result = [];

    const GMTtoday = new Date();

    //IST Today
    let today = new Date(GMTtoday.getTime() + IST_OFFSET);

    let Month = today.getMonth() + 1;
    let Year = today.getFullYear();

    const startOfWeekGMT = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay()
    );
    const startOfWeek = new Date(
      startOfWeekGMT.getTime() + 5.5 * 60 * 60 * 1000
    );

    const endOfWeekGMT = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + (6 - today.getDay())
    );
    const endOfWeek = new Date(endOfWeekGMT.getTime() + 5.5 * 60 * 60 * 1000);

    // console.log(startOfWeek, endOfWeek);

    const startOfMonthGMT = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfMonth = new Date(startOfMonthGMT.getTime() + IST_OFFSET);

    const endOfMonthGMT = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    );
    const endOfMonth = new Date(endOfMonthGMT.getTime() + IST_OFFSET);

    console.log(startOfMonth, endOfMonth);

    // Get the date of the last 90 days
    let last90DaysGMT = new Date();
    last90DaysGMT.setDate(last90DaysGMT.getDate() - 90);
    const last90Days = new Date(last90DaysGMT.getTime() + IST_OFFSET);

    const incompleteServiceRequests = await Service_Request.find({
      location,
      "status.done.check": false,
      date: { gte: last90Days },
    });

    const completeServiceRequests = await Service_Request.find({
      location,
      "status.done.check": true,
      date: { gte: last90Days },
    });

    const weeklyBookedServiceRequests = await Service_Request.find({
      location,
      date: { $gte: startOfWeek, $lt: endOfWeek },
    });

    const weeklyDoneServiceRequests = await Service_Request.find({
      location,
      "status.done.check": true,
      "status.done.date_time": { $gte: startOfWeek, $lt: endOfWeek },
    });

    const monthlyBookedServiceRequests = await Service_Request.find({
      location,
      date: { $gte: startOfMonth, $lt: endOfMonth },
    });

    const monthlyDoneServiceRequests = await Service_Request.find({
      location,
      "status.done.check": true,
      "status.done.date_time": { $gte: startOfMonth, $lt: endOfMonth },
    });

    result.push({
      incomplete: incompleteServiceRequests.length,
      complete: completeServiceRequests.length,
      weeklyBooked: weeklyBookedServiceRequests.length,
      weeklyDone: weeklyDoneServiceRequests.length,
      monthlyBooked: monthlyBookedServiceRequests.length,
      monthlyDone: monthlyDoneServiceRequests.length,
    });

    res.status(200).send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(`Error: ${error}`);
  }
}

module.exports = {
  getServiceRecords,
  getRiderServiceRecords,
  getOwnerServiceRecords,
  getTechnicianServiceRecords,
  getEmployeeServiceRecords,
};
