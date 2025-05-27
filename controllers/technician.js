const Service_Request = require("../model/servicerequest");
const User = require("../model/user");
const { issueType } = require("../model/issueType");
// const { response } = require("express");

const getTechnicianNames = async (location) => {
  const technicianQuery = { role: "Technician" };
  if (location && location != "") {
    technicianQuery.location = location;
  }
  const technicians = await User.find(technicianQuery);
  const technicianNames = technicians.map((data) => {
    return { name: data.name, id: data._id };
  });
  return technicianNames;
};

const getServiceData = async (location) => {
  const weekTime = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
  const data = await Service_Request.find({
    closure_date: { $gte: new Date(weekTime) },
    // "status.done.check": true,
    location,
  });
  return data;
};
const getAverageTime = async (req, res) => {
  let location;

  //check if user provides seperate location
  if (req.body.location) {
    location = req.body.location;
  } else {
    location = req.user.location;
  }
  let averageTime;
  let totalTime = 0;
  let resultArr = [];
  try {
    const technicianNames = await getTechnicianNames(location);
    const serviceData = await getServiceData(location);
    resultArr = technicianNames.map((technician) => {
      let numberOfTickets = 0;
      const { name, id } = technician;
      serviceData.forEach((service) => {
        if (
          service.assigned_to.technician == name ||
          service.assigned_to?.id == id
        ) {
          const completionTimeMS =
            new Date(service.closure_date).getTime() -
            new Date(service.date).getTime();

          const completionTime =
            (completionTimeMS / (1000 * 60 * 60)).toFixed(1) - 0; //-0 to convert it to number
          totalTime += completionTime;
          numberOfTickets++;
        }
      });
      averageTime = (totalTime / numberOfTickets).toFixed(1) - 0;
      numberOfTickets = 0;
      totalTime = 0;
      return { name: name, averageTime: averageTime || 0 };
    });

    res.json(resultArr);
  } catch (error) {
    res.send("Something went wrong");
    console.log(error);
  }
};

const getOnTimeAndDelayedTasks = async (req, res) => {
  try {
    let location;

    //check if user provides seperate location
    if (req.body.location) {
      location = req.body.location;
    } else {
      location = req.user.location;
    }
    const issueTypes = await issueType.find({});
    let resultArr = [];
    const technicianNames = await getTechnicianNames(location);
    const timeSpan = ["monthly", "weekly"];
    let tempObj = {};
    for (let k = 0; k < technicianNames.length; k++) {
      for (let i = 0; i < timeSpan.length; i++) {
        let time;
        if (timeSpan[i] === "monthly")
          time = new Date().getTime() - 30 * 24 * 60 * 60 * 1000;
        if (timeSpan[i] === "weekly")
          time = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;

        const serviceData = await Service_Request.find({
          date: { $gte: new Date(time) },
          location,
          "status.done.check": true,
          $or:[
            {
              "assigned_to.technician": technicianNames[k].name,
            },
            {
              "assigned_to.id": technicianNames[k].id,
            }
          ]
        });
        let completionTimeMS = 0;
        let completionTime = 0;
        let maxTime = 0;
        let onTimeTasks = 0;
        let delayedTasks = 0;
        for (let j = 0; j < serviceData.length; j++) {
          completionTimeMS =
            new Date(serviceData[j].closure_date).getTime() -
            new Date(serviceData[j].date).getTime();
          completionTime = (completionTimeMS / (1000 * 60 * 60)).toFixed(1) - 0;
          maxTime = 0;
          if (serviceData[j].issue_type.length > 0) {
            serviceData[j].issue_type.forEach((issue) => {
              issueTypes.forEach((ele) => {
                if (ele.name == issue) {
                  maxTime = Math.max(maxTime, ele.time_limit);
                }
              });
            });
            if (maxTime >= completionTime) {
              onTimeTasks++;
            } else {
              delayedTasks++;
            }
          }
        }
        tempObj = { ...tempObj, [timeSpan[i]]: { onTimeTasks, delayedTasks } };
      }
      resultArr.push({
        technician: technicianNames[k].name,
        data: tempObj,
      });
      tempObj = {};
    }
    res.json(resultArr);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error: " + err.message);
  }
};

const getWeeklyAnalysis = async (req, res) => {
  try {
    let technicianNames = [];
    const { start_date, end_date, location, requestType } = req.body;

    if (!start_date && !end_date) {
      return res
        .status(400)
        .send({ data: [], message: "Couldn't find start_date or end_date" });
    }
    technicianNames = await getTechnicianNames(location);
    if (technicianNames.length == 0) {
      return res.status(400).send({ data: [], message: "No Technician Found" });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const serviceQuery = {
      closure_date: {
        $gte: startDate,
        $lte: endDate,
      },
      location,
    };
    if (requestType) {
      serviceQuery.request_type = requestType;
    }

    const serviceData = await Service_Request.find(serviceQuery, {
      date: 1,
      closure_date: 1,
      assigned_to: 1,
      ticket_id: 1,
      request_type: 1,
      location: 1,
    });

    let weekStart = startDate.getTime();
    const currentDay = Number(startDate.getDay());
    let weekEnd = weekStart + (7 - currentDay) * 24 * 60 * 60 * 1000;
    let resultArr = [];

    while (weekStart < endDate.getTime()) {
      const result = [];
      technicianNames.forEach((ele) => {
        const { name:technician, id } = ele;
        const data = serviceData.filter((service) => {
          return (
            (service.assigned_to.technician === technician ||
              service.assigned_to?.id == id) &&
            new Date(service.closure_date).getTime() >= weekStart &&
            new Date(service.closure_date).getTime() <= weekEnd
          );
        });
        result.push({
          name: technician,
          count: data.length,
        });
      });
      resultArr.push({
        start_date: new Date(weekStart),
        end_date: new Date(weekEnd),
        data: result,
      });
      weekStart = weekEnd + 1 * 24 * 60 * 60 * 1000;
      weekEnd = weekEnd + 7 * 24 * 60 * 60 * 1000;
    }
    res.json(resultArr);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error: " + error.message);
  }
};

const technicianPerformance = async (req, res) => {
  try {
    const { location } = req.body;
    let resultArr = [];

    const serviceQuery = {
      closure_date: {
        $gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
        $lte: new Date(),
      },
    };

    if (location) {
      serviceQuery.location = location;
    }

    const technicianNames = await getTechnicianNames(location);
    if (technicianNames.length == 0) {
      return res.status(400).send({ data: [], message: "No Technician Found" });
    }

    const serviceData = await Service_Request.find(serviceQuery, {
      date: 1,
      closure_date: 1,
      assigned_to: 1,
      ticket_id: 1,
      request_type: 1,
      location: 1,
    });

    technicianNames.forEach((ele) => {
      const {name:techncian,id}= ele;
      const data = serviceData.filter((service) => {
        return (service.assigned_to.technician === techncian || service.assigned_to?.id == id);
      });
      resultArr.push({
        technician: techncian,
        total_tickets: data.length,
      });
    });
    resultArr.sort(
      (firstEle, secondEle) => firstEle.total_tickets - secondEle.total_tickets
    );
    res.json(resultArr);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error: " + err.message);
  }
};

module.exports = {
  getAverageTime,
  getOnTimeAndDelayedTasks,
  getWeeklyAnalysis,
  technicianPerformance,
};
