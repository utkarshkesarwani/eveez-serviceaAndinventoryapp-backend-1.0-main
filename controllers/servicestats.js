const Service_Request = require("../model/servicerequest");
const User = require("../model/user");

const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

async function getTodayLocAndStatus(req, res) {
  try {
    let location;

    //check if user provides seperate location
    if (req.body.location) {
      location = req.body.location;
    } else {
      location = req.user.location;
    }
    let locStatusObj = {};

    if (req.body.data) {
      if (req.body.data.location) {
        locStatusObj = {
          NCR: { total: 0 },
          Bangalore: { total: 0 },
          Hyderabad: { total: 0 },
          Kolkata: { total: 0 },
          Chandigarh: { total: 0 },
        };
      }
    } else {
      locStatusObj[location] = { total: 0 };
    }

    let today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log("gmt", today);

    let ISTDate = new Date(today.getTime() + 5.5 * 60 * 60 * 1000);
    console.log("ISTtODAY", ISTDate);

    const srData = await Service_Request.find({
      date: { $gte: ISTDate },
      location,
    });

    console.log(srData.length);

    srData.map(async (ele) => {
      let loc = ele["location"];
      let status = ele["status"];

      if (ele["status"].done.check) {
        status = "Done";
      } else if (ele["status"].to_do.check && ele["status"].in_progress.check) {
        status = "In Progress";
      } else {
        status = "To Do";
      }

      if (loc !== "") {
        if (locStatusObj[loc] === undefined) {
          locStatusObj[loc] = {};
        }

        if (status !== undefined) {
          if (locStatusObj[loc][status] !== undefined) {
            locStatusObj[loc][status] += 1;
          } else {
            locStatusObj[loc][status] = 1;
          }
        }
        locStatusObj[loc]["total"] += 1;
      }
    });

    const formattedData = {};

    for (let loc in locStatusObj) {
      const city = loc;
      const done = locStatusObj[loc]["Done"] || 0;
      const to_do = locStatusObj[loc]["To Do"] || 0;
      const in_progress = locStatusObj[loc]["In Progress"] || 0;
      const total = locStatusObj[loc]["total"] || 0;

      if (city) {
        formattedData[city] = { done, to_do, in_progress, total };
      }
    }
    //console.log(formattedData);

    res.status(200).json({ code: 1, data: formattedData });
  } catch (error) {
    res.status(500).json({ code: 0, data: `Error: ${error}` });
  }
}

async function getWeeklyServiceRequests(req, res) {
  try {
    let location;

    //check if user provides seperate location
    if (req.body.location) {
      location = req.body.location;
    } else {
      location = req.user.location;
    }
    let locStatusObj = {};
    if (req.body.data) {
      if (req.body.data.location) {
        locStatusObj = {
          NCR: { total: 0 },
          Bangalore: { total: 0 },
          Hyderabad: { total: 0 },
          Kolkata: { total: 0 },
          Chandigarh: { total: 0 },
        };
      }
    } else {
      locStatusObj[location] = { total: 0 };
    }
    let weeklyServiceRequests;
    if (req.body.startDate == "" && req.body.endDate == "") {
      const IST_OFFSET = 5.5 * 60 * 60 * 1000;
      // Get weekly and monthly done service requests for the technician
      const GMTtoday = new Date();
      GMTtoday.setHours(0, 0, 0, 0);
      // IST Today
      let today = new Date(GMTtoday.getTime() + IST_OFFSET);
      let firstday = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
      let lastday = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000);
      // console.log(technician);
      weeklyServiceRequests = await Service_Request.find(
        {
          date: { $gte: firstday, $lte: lastday },
          location,
        },
        { status: 1, date: 1, location: 1 }
      );
    } else if (req.body.startDate != "" && req.body.endDate != "") {
      weeklyServiceRequests = await Service_Request.find(
        {
          date: {
            $gte: new Date(req.body.startDate),
            $lte: new Date(req.body.endDate),
          },
          location,
        },
        { status: 1, date: 1, location: 1 }
      );
    } else if (req.body.startDate != "" && req.body.endDate == "") {
      weeklyServiceRequests = await Service_Request.find(
        {
          date: { $gte: new Date(req.body.startDate) },
          location,
        },
        { status: 1, date: 1, location: 1 }
      );
    } else if (req.body.startDate == "" && req.body.endDate != "") {
      weeklyServiceRequests = await Service_Request.find(
        {
          date: { $lte: new Date(req.body.endDate) },
          location,
        },
        { status: 1, date: 1, location: 1 }
      );
    }
    weeklyServiceRequests.forEach((ele) => {
      let loc = ele["location"];
      let status = "";
      if (ele["status"].done.check) {
        status = "Done";
      } else if (ele["status"].to_do.check && ele["status"].in_progress.check) {
        status = "In Progress";
      } else {
        status = "To Do";
      }
      if (loc !== "") {
        if (locStatusObj[loc] === undefined) {
          locStatusObj[loc] = {};
        }
        if (status !== undefined) {
          if (locStatusObj[loc][status] !== undefined) {
            locStatusObj[loc][status] += 1;
          } else {
            locStatusObj[loc][status] = 1;
          }
        }
        locStatusObj[loc]["total"] += 1;
      }
    });
    const formattedData = {};
    for (let loc in locStatusObj) {
      const city = loc;
      const done = locStatusObj[loc]["Done"] || 0;
      const to_do = locStatusObj[loc]["To Do"] || 0;
      const in_progress = locStatusObj[loc]["In Progress"] || 0;
      const total = locStatusObj[loc]["total"] || 0;
      if (city) {
        formattedData[city] = { done, to_do, in_progress, total };
      }
    }
    //console.log(formattedData);
    res.status(200).json({ code: 1, data: formattedData });
  } catch (error) {
    res.status(500).json({ code: 0, data: `Error: ${error}` });
  }
}

async function getWeeklyTechnicianData(req, res) {
  try {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    let dateFormat;
    let technicianDaywise;
    let result = [];

    let location;

    //check if user provides seperate location
    if (req.body.location) {
      location = req.body.location;
    } else {
      location = req.user.location;
    }

    // Get weekly and monthly done service requests for the technician
    const GMTtoday = new Date();
    GMTtoday.setHours(0, 0, 0, 0);
    console.log(GMTtoday);

    // IST Today
    let today = new Date(GMTtoday.getTime() + IST_OFFSET);
    console.log("ist", today);

    let firstday = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    let lastday = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000);

    console.log(firstday, lastday);

    //get daywiseData format as  we want it each technician object
    const daywiseDetails = {};
    // Loop through each day of the week
    for (let index = 0; index < 7; index++) {
      const today = new Date();
      const date = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - index
      );
      // console.log(date);
      dateFormat = date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      daywiseDetails[dateFormat] = {
        to_do: 0,
        in_progress: 0,
        done: 0,
      };
    }

    const technicians = await User.find(
      { role: "Technician", location },
      { _id: 1, name: 1, location: 1 }
    );
    console.log(technicians.length);

    // Extract technician names and locations for use in queries
    const technicianNames = technicians.map((tech) => tech.name);
    const technicianLocations = technicians.map((tech) => tech.location);

    // Retrieve all relevant service requests for today
    const serviceRequests = await Service_Request.find({
      "assigned_to.technician": { $in: technicianNames },
      $or: [
        {
          "status.to_do.date_time": {
            $gte: firstday,
            $lte: lastday,
          },
        },
        {
          "status.done.date_time": {
            $gte: firstday,
            $lte: lastday,
          },
        },
        {
          "status.in_progress.date_time": {
            $gte: firstday,
            $lte: lastday,
          },
        },
      ],
    });

    console.log(serviceRequests.length, "total");

    // Loop through each technician
    for (let i = 0; i < technicians.length; i++) {
      const technicianObj = technicians[i];
      const technicianID = technicianObj._id;
      const technician = technicianObj.name;
      const location = technicianObj.location;

      // console.log(technician);

      const weeklyServiceRequests = serviceRequests.filter(
        (request) =>
          request["assigned_to"]["technician"] === technician &&
          request["location"] === location
      );
      console.log(weeklyServiceRequests.length, technician);

      technicianDaywise = deepCopy(daywiseDetails);

      for (let ele of weeklyServiceRequests) {
        // console.log(ele.date);
        // console.log(ele);
        let status = "";

        if (ele["status"].done.check) {
          status = "done";
          let doneDateTime = ele.status.done.date_time;
          dateFormat = doneDateTime.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        } else if (
          ele["status"].to_do.check &&
          ele["status"].in_progress.check
        ) {
          status = "in_progress";
          let inProgressDateTime = ele.status.in_progress.date_time;
          dateFormat = inProgressDateTime.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        } else {
          status = "to_do";
          let toDoDateTime = ele.status.to_do.date_time;
          dateFormat = toDoDateTime.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        }

        // console.log(technician, dateFormat, status);
        if (technicianDaywise[dateFormat]) {
          technicianDaywise[dateFormat][status] += 1;
        } else {
          console.log(ele.date, dateFormat);
        }
      }

      // console.log(technicianDaywise);
      let convertedData = convertDayWiseData(technicianDaywise);
      // console.log(convertedData);
      console.log("doney");

      result.push({
        technicianID,
        technicianName: technician,
        location,
        total: weeklyServiceRequests.length,
        daywiseData: convertedData,
      });

      technicianDaywise = daywiseDetails;
    }

    result.sort((a, b) => b.total - a.total);

    res.status(200).json({ code: 1, data: result });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ code: 0, data: "Error getting service requests by technician" });
  }
}

async function getDailyTechnicianData(req, res) {
  console.log(req.user, "user");
  try {
    // Offset for IST time zone
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    let location;

    //check if user provides seperate location
    if (req.body.location) {
      location = req.body.location;
    } else {
      location = req.user.location;
    }
    let serviceRequests;
    const { startDate, endDate } = req.body;
    console.log(startDate, endDate, "hello");

    // Get the start of today in GMT
    const GMTtoday = new Date();
    GMTtoday.setHours(0, 0, 0, 0);

    // Convert to IST by adding the offset
    const today = new Date(GMTtoday.getTime() + IST_OFFSET);
    console.log(today);

    // Get all technicians from the database
    const technicians = await User.find(
      { role: "Technician", location },
      { _id: 1, name: 1, location: 1 }
    );

    // Extract technician names and locations for use in queries
    const technicianNames = technicians.map((tech) => tech.name);
    const technicianLocations = technicians.map((tech) => tech.location);

    // Retrieve all relevant service requests for today
    if (startDate == "" && endDate == "") {
      serviceRequests = await Service_Request.find({
        "assigned_to.technician": { $in: technicianNames },
        location: { $in: technicianLocations },
        $or: [
          {
            "status.to_do.date_time": {
              $gte: today,
            },
          },
          {
            "status.done.date_time": {
              $gte: today,
            },
          },
          {
            "status.in_progress.date_time": {
              $gte: today,
            },
          },
        ],
      });
    } else if (startDate !== "" && endDate !== "") {
      serviceRequests = await Service_Request.find({
        "assigned_to.technician": { $in: technicianNames },
        location: { $in: technicianLocations },
        $or: [
          {
            "status.to_do.date_time": {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            },
          },
          {
            "status.done.date_time": {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            },
          },
          {
            "status.in_progress.date_time": {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            },
          },
        ],
      });
    }

    // Process service requests for each technician
    const result = technicians.map((tech) => {
      const { _id: technicianID, name, location } = tech;

      // Filter service requests for the current technician
      const technicianServiceRequests = serviceRequests.filter(
        (request) =>
          request["assigned_to"]["technician"] === name &&
          request["location"] === location
      );

      let to_do = 0;
      let in_progress = 0;
      let done = 0;

      // Calculate status counts for the technician
      technicianServiceRequests.forEach((request) => {
        // console.log(request.ticket_id);
        if (request.status.done.check) {
          done += 1;
        } else if (
          request.status.to_do.check &&
          request.status.in_progress.check
        ) {
          in_progress += 1;
        } else {
          to_do += 1;
        }
      });

      // console.log(to_do, in_progress, done, name);
      return {
        technicianID,
        technicianName: name,
        location,
        to_do,
        in_progress,
        done,
        total: technicianServiceRequests.length,
      };
    });

    //sort acc to total
    result.sort((a, b) => b.total - a.total);

    // Respond with the processed data
    res.status(200).json({ code: 1, data: result });
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ code: 0, data: "Error getting service requests by technician" });
  }
}

async function getMonthlyTechnicianData(req, res) {
  try {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let location;

    //check if user provides seperate location
    if (req.body.location) {
      location = req.body.location;
    } else {
      location = req.user.location;
    }
    const technicians = await User.find(
      { role: "Technician", location },
      { name: 1, location: 1 }
    );

    const monthlyData = [];

    // Function to process technician's monthly data
    async function processTechnicianData(technician) {
      const technicianMonthlyData = [];
      let overallTotal = 0;

      for (let i = 2; i >= 0; i--) {
        let to_do = 0;
        let in_progress = 0;
        let done = 0;

        const month = (currentMonth - i + 12) % 12;
        const year = currentYear - (i > currentMonth ? 1 : 0);
        const monthName = new Date(year, month).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });

        let GMTfirstday = new Date(year, month, 1);
        let GMTlastday = new Date(year, month + 1, 0);
        GMTlastday.setHours(23, 59, 59, 59);

        //convert it into IST time
        let firstday = new Date(GMTfirstday.getTime() + IST_OFFSET);
        let lastday = new Date(GMTlastday.getTime() + IST_OFFSET);
        // console.log(firstday, lastday);

        const technicianData = await Service_Request.aggregate([
          {
            $match: {
              "assigned_to.technician": technician.name,
              location: technician.location,
              $or: [
                {
                  date: {
                    $gte: firstday,
                    $lt: lastday,
                  },
                },
                {
                  closure_date: {
                    $gte: firstday,
                    $lt: lastday,
                  },
                },
              ],
            },
          },
        ]);

        console.log(technician.name, technicianData.length, monthName);

        // Calculate to_do, in_progress, done counts
        technicianData.forEach((data) => {
          if (data.status.done.check) {
            done += 1;
          } else if (data.status.to_do.check && data.status.in_progress.check) {
            in_progress += 1;
          } else {
            to_do += 1;
          }
        });

        const total = to_do + in_progress + done;
        overallTotal += total;

        const monthlyDataEntry = {
          month: monthName,
          to_do,
          in_progress,
          done,
          total,
        };

        technicianMonthlyData.push(monthlyDataEntry);
      }

      return {
        technicianID: technician._id,
        location: technician.location,
        technicianName: technician.name,
        overallTotal,
        monthlyData: technicianMonthlyData,
      };
    }

    // Process technician data in parallel
    const processedTechnicianData = await Promise.all(
      technicians.map(processTechnicianData)
    );

    // Sort data by overallTotal
    processedTechnicianData.sort((a, b) => b.overallTotal - a.overallTotal);

    const response = {
      code: 1,
      data: processedTechnicianData,
    };

    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ code: 0, data: "Error getting technicians' monthly data" });
  }
}

async function getServiceRequestStats(req, res) {
  try {
    const role = req.user.role;
    const {
      location: reqLocation,
      technician,
      startDate,
      endDate,
    } = req.body.data;
    let location;

    console.log(role);

    if (role == "Admin") {
      location = reqLocation ? reqLocation : "";
    } else {
      location = req.user.location;
    }
    let locStatusObj = {};
    if (req.body.data) {
      if (!reqLocation) {
        locStatusObj = {
          NCR: { total: 0 },
          Bangalore: { total: 0 },
          Hyderabad: { total: 0 },
          Kolkata: { total: 0 },
          Chandigarh: { total: 0 },
        };
      } else {
        console.log(reqLocation, "670");
        locStatusObj[location] = { total: 0 };
      }
    }
    let serviceRequests;
    if (startDate == "" && endDate == "") {
      const IST_OFFSET = 5.5 * 60 * 60 * 1000;
      // Get weekly and monthly done service requests for the technician
      const GMTtoday = new Date();
      GMTtoday.setHours(0, 0, 0, 0);
      // IST Today
      let today = new Date(GMTtoday.getTime() + IST_OFFSET);
      let firstday = today;
      serviceRequests = await Service_Request.find(
        {
          date: {
            $gte: firstday,
            // , $lte: lastday
          },
          location: new RegExp(location, "i"),
          ...(technician.name || technician.key
            ? { $or: [
                { "assigned_to.technician": new RegExp(technician.name, "i") },
                { "assigned_to.id": technician.key }
              ] }
            : {})
          
        },
        { status: 1, date: 1, location: 1 }
      );

    } else if (startDate != "" && endDate != "") {
      serviceRequests = await Service_Request.find(
        {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
          location: new RegExp(location, "i"),
          ...(technician.name || technician.key
            ? { $or: [
                { "assigned_to.technician": new RegExp(technician.name, "i") },
                { "assigned_to.id": technician.key }
              ] }
            : {})
          
        },
        { status: 1, date: 1, location: 1 }
      );
    } else if (startDate != "" && endDate == "") {
      serviceRequests = await Service_Request.find(
        {
          date: { $gte: new Date(startDate) },
          location: new RegExp(location, "i"),
          ...(technician.name || technician.key
            ? { $or: [
                { "assigned_to.technician": new RegExp(technician.name, "i") },
                { "assigned_to.id": technician.key }
              ] }
            : {})
          
        },
        { status: 1, date: 1, location: 1 }
      );
    } else if (startDate == "" && endDate != "") {
      serviceRequests = await Service_Request.find(
        {
          date: { $lte: new Date(endDate) },
          location: new RegExp(location, "i"),
          ...(technician.name || technician.key
            ? { $or: [
                { "assigned_to.technician": new RegExp(technician.name, "i") },
                { "assigned_to.id": technician.key }
              ] }
            : {})
          
        },
        { status: 1, date: 1, location: 1 }
      );
    }

    serviceRequests.forEach((ele) => {
      let loc = ele["location"];
      let status = "";
      if (ele["status"].done.check) {
        status = "Done";
      } else if (ele["status"].to_do.check && ele["status"].in_progress.check) {
        status = "In Progress";
      } else {
        status = "To Do";
      }
      if (loc !== "") {
        if (locStatusObj[loc] === undefined) {
          locStatusObj[loc] = {};
        }
        if (status !== undefined) {
          if (locStatusObj[loc][status] !== undefined) {
            locStatusObj[loc][status] += 1;
          } else {
            locStatusObj[loc][status] = 1;
          }
        }
        locStatusObj[loc]["total"] += 1;
      }
    });
    const formattedData = {};
    console.log(locStatusObj);
    for (let loc in locStatusObj) {
      const city = loc;
      const done = locStatusObj[loc]["Done"] || 0;
      const to_do = locStatusObj[loc]["To Do"] || 0;
      const in_progress = locStatusObj[loc]["In Progress"] || 0;
      const total = locStatusObj[loc]["total"] || 0;
      if (city) {
        formattedData[city] = { done, to_do, in_progress, total };
      }
    }
    //console.log(formattedData);
    res.status(200).json({ code: 1, data: formattedData });
  } catch (error) {
    res.status(500).json({ code: 0, data: `Error: ${error}` });
    console.log(error);
  }
}
//convert ddaywise day from object to array
function convertDayWiseData(daywiseData) {
  const convertedData = [];
  for (const dateStr in daywiseData) {
    if (daywiseData.hasOwnProperty(dateStr)) {
      const dateObj = new Date(dateStr);
      const { to_do, in_progress, done } = daywiseData[dateStr];
      convertedData.push({
        day: dateObj.toLocaleDateString("en-US", { weekday: "short" }),
        date: dateStr,
        to_do,
        in_progress,
        done,
      });
    }
  }
  return convertedData;
}
module.exports = {
  getTodayLocAndStatus,
  getWeeklyTechnicianData,
  getWeeklyServiceRequests,
  getDailyTechnicianData,
  getMonthlyTechnicianData,
  getServiceRequestStats,
  deepCopy,
};
