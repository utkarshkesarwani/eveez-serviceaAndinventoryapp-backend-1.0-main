const Rider = require("../model/rider");
const Service_Request = require("../model/servicerequest");

async function searchByVehicleid(req, res) {
  try {
    const vehicleStr = req.body.data.vehicle;
    const type = req.body.data.type;
    const technician_name = req.body.data.technician_name;

    let matchingData;

    let searchCriteria = {
      $and: [],
    };

    //if sent in string wont run properly:)
    if (vehicleStr !== null || vehicleStr !== "null") {
      searchCriteria = {
        $and: [{ vehicle: new RegExp(`^${vehicleStr}`, "i") }],
      };
    }

    let location = req.user.location;
    searchCriteria.$and.push({ location: location });

    if (technician_name !== undefined) {
      if (technician_name !== "") {
        searchCriteria.$and.push({ "assigned_to.technician": technician_name });
      }
    }

    if (type === "open") {
      searchCriteria.$and.push({ "status.done.check": false });
    } else if (type === "closed") {
      searchCriteria.$and.push({ "status.done.check": true });
    } else if (type === "unassigned") {
      searchCriteria.$and.push({ "assigned_to.check": false });
    } else if (type === "in_progress") {
      searchCriteria.$and.push({ "status.to_do.check": true });
      searchCriteria.$and.push({ "status.in_progress.check": true });
      searchCriteria.$and.push({ "status.done.check": false });
    } else if (type === "to_do") {
      searchCriteria.$and.push({ "status.to_do.check": true });
      searchCriteria.$and.push({ "status.in_progress.check": false });
      searchCriteria.$and.push({ "status.done.check": false });
    }

    if (req.user.role === "Owner") {
      let mob_number = req.user.mob_number;

      let riderForOwner = await Rider.find(
        { owner_mob: mob_number },
        { _id: 0, vehicle_no: 1 }
      );

      let allRidersVehicle = [];
      riderForOwner.forEach((vehicle) => {
        allRidersVehicle.push(vehicle.vehicle_no);
      });

      let temp = {
        ...searchCriteria,
        vehicle: { $in: allRidersVehicle },
      };

      console.log("temp", temp);

      matchingData = await Service_Request.find({
        ...searchCriteria,
        vehicle: { $in: allRidersVehicle },
      });
    } else if (req.user.role === "Rider") {
      let vehicle_no = req.user.vehicle_no;

      matchingData = await Service_Request.find({
        ...searchCriteria,
        vehicle: vehicle_no,
      });
    } else {
      if (req.user.role === "Technician") {
        let technician = req.user.name;
        searchCriteria.$and.push({ "assigned_to.technician": technician });

        //if giving closed tickets show the data only of current month
        if (type === "closed") {
          const IST_OFFSET = 5.5 * 60 * 60 * 1000;

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
          searchCriteria.$and.push({
            "status.done.date_time": { $gte: firstDay },
          });
        }
      }

      console.log(req.body.data,"request");

      if (req.user.role === "Manager" || req.user.role === "Employee") {
        //if giving closed tickets show the data only of current month
        if (type === "closed") {
          let firstDay;

          if (!req.body.data.date) {
            console.log("entered");
            const IST_OFFSET = 5.5 * 60 * 60 * 1000;

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
            console.log("hello",firstDayGMT);
            firstDay = new Date(firstDayGMT.getTime() + IST_OFFSET);
          }
          else{
            firstDay = new Date(req.body.data.date)
          }
          console.log("hello",firstDay);
          searchCriteria.$and.push({
            "status.done.date_time": { $gte: firstDay },
          });
        }
        else if(req.body.data.date){
          searchCriteria.$and.push({
            date: { $gte: new Date(req.body.data.date) },
          });
        }
      }
      console.log("scrieria", searchCriteria);
      matchingData = await Service_Request.find(searchCriteria);
    }

    let matchingDocs = [];
    matchingData.map(async (ele) => {
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

      matchingDocs.push({
        ticketId,
        vehicleID,
        customerName,
        type,
        date,
        status,
        technician,
      });
    });

    const sortedMatchingDocs = matchingDocs.sort((a, b) => {
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

    res.status(200).send(sortedMatchingDocs);
  } catch (err) {
    // console.log(err);
    res.status(500).json(`Error searching by vehicle`);
  }
}

module.exports = { searchByVehicleid };
