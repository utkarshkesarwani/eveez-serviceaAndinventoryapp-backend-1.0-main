const Service_Request = require("../model/servicerequest");

async function getRequestsStats(req, res) {
  try {
    let resData = [];
    let location;

    //check if user provides seperate location
    if(req.body.location){
        location = req.body.location;
    }else{
      location = req.user.location;
    }
    console.log(location);

    // Calculate first and last day of current month in IST
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Adjust for IST
    const firstDayIST = new Date(firstDayOfMonth.getTime() + IST_OFFSET);
    const lastDayIST = new Date(lastDayOfMonth.getTime() + IST_OFFSET);

    let serviceRequests = await Service_Request.find(
      {
        date: {
          $gte: firstDayIST,
          $lte: lastDayIST
        },
        location: new RegExp(location, "i")
      },
      { status: 1, date: 1, location: 1 }
    );

    // Initialize counters
    let openTickets = 0;
    let todoCount = 0;
    let inProgressCount = 0;
    let doneCount = 0;

    // Count statuses
    serviceRequests.forEach((ele) => {
      if (ele.status.done.check) {
        doneCount++;
      } else if (ele.status.to_do.check && ele.status.in_progress.check) {
        inProgressCount++;
        openTickets++;
      } else if (ele.status.to_do.check) {
        todoCount++;
        openTickets++;
      }
    });

    resData.push({ name: "openTickets", count: openTickets });
    resData.push({ name: "To Do", count: todoCount });
    resData.push({ name: "In Progress", count: inProgressCount });
    resData.push({ name: "Done", count: doneCount });
    resData.push({ name: "totalTickets", count: todoCount + inProgressCount + doneCount });

    res.status(200).send(resData);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}

const getLastSixMonthsStats = async (req, res) => {
  try {
    let location = req.user.location;
    const currentTime = new Date().setHours(0, 0, 0, 0) + 5.5 * 60 * 60 * 1000;
    const sixMonthTime = currentTime - 6 * 30 * 24 * 60 * 60 * 1000;
    let resultArr = [];

    const data = await Service_Request.find({
      date: { $gte: new Date(sixMonthTime) },
    });
    console.log(data, location);

    res.json(data);
  } catch (error) {
    res.status(500).send("Something went wrong"+(error.message));
    console.log(error);
  }
};

module.exports = {
  getRequestsStats,
  getLastSixMonthsStats,
};
