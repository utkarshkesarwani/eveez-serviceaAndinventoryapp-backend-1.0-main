const Plan = require("../model/plan");
const mongoose = require("mongoose");
const { tripData } = require("../model/tripdata");
const { extrakmsDetails } = require("../model/extrakmsDetails");
const Service_Request = require("../model/servicerequest");
const { vehicleDetails } = require("../model/vehDetails");
const { logroute } = require("../logger/lgs");
const ObjectId = mongoose.Types.ObjectId;

const createPlan = async (req, res) => {
  try {
    logroute(req)

    const {
      planName,
      fup,
      image,
      type,
      range,
      subscriptions_cost,
      number_of_passsengers,
      registration,
      carrying_capacity,
      speed_range,
      battery_capacity,
    } = req.body;

    if (
      !planName ||
      !fup ||
      !image ||
      !type ||
      !range ||
      !subscriptions_cost ||
      !number_of_passsengers ||
      !carrying_capacity ||
      !speed_range ||
      !battery_capacity ||
      !registration
    ) {
      res.status(400);
      throw new Error("All fields are required");
    }

    const plan = await Plan.create({
      id: new ObjectId(),
      planName,
      fup,
      image,
      type,
      range,
      subscriptions_cost,
      number_of_passsengers,
      registration,
      carrying_capacity,
      speed_range,
      battery_capacity,
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getAllPlans = async (req, res) => {
  try {
    logroute(req)

    const plans = await Plan.find({}).select("-_id");

    if (!plans) {
      res.status(404);
      throw new Error("Not found");
    }

    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getPlanDetails = async (req, res) => {
  try {
    logroute(req);

    const { sortName } = req.query;
    let plan;
    let distanceRange = { SH: 2000, SS: 3300, FR: 2500, SF: 3500 };
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;

    let vehicle = req.user.vehicle_no;
    let rider = req.user.name
    let location = req.user.location


    const GMTtoday = new Date();
    //IST Today
    let today = new Date(GMTtoday.getTime() + 5.5 * 60 * 60 * 1000);
    let yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    console.log(today, yesterday, GMTtoday);

    let Month = yesterday.getMonth() + 1;
    let Year = yesterday.getFullYear();

    let last90DaysGMT = new Date();
    last90DaysGMT.setDate(last90DaysGMT.getDate() - 90);
    const last90Days = new Date(last90DaysGMT.getTime() + IST_OFFSET);

    if (sortName) {
      plan = await Plan.findOne({ sortName }).select("-_id").lean();
    }

    if (!plan) {
      res.status(404);
      throw new Error("Not found");
    }

    let vehicleKMSData = await extrakmsDetails.find(
      {
        AssetName: vehicle,
        Month,
        Year,
      },
      { _id: 0, TotalDistance: 1 }
    );
    console.log(vehicle, Month, Year);
    console.log(vehicleKMSData);

    //steps to calculate FUP
    let fupPercent = "N/A";
    let totalDistance;
    let monthlyRange;
    if (distanceRange[sortName] !== undefined) {
      monthlyRange = distanceRange[sortName];
    }

    if (vehicleKMSData.length > 0) {
      totalDistance = vehicleKMSData[0].TotalDistance;
      if (totalDistance) {
        totalDistance = Number(totalDistance.toFixed(2));
      }

      console.log(totalDistance);

      fupPercent = Number(((totalDistance / monthlyRange) * 100).toFixed(2));
    }
    
    plan.fup = fupPercent
    

    let tripDataResult = [];
    let serviceRequestData = await Service_Request.find(
      {
        vehicle,
        location,
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
      // console.log(tripDataResult);
    }

    plan["tripData"] = tripDataResult;
    plan["vehicle_no"] = vehicle
    plan["rider"] = rider

    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createPlan,
  getAllPlans,
  getPlanDetails,
};
