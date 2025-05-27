const xlsx = require("xlsx");
const { assign } = require("nodemailer/lib/shared");
const { sendEmail } = require("../middlewares/sendEmail");
const Rider = require("../model/rider");
const Service_Request = require("../model/servicerequest");
const User = require("../model/user");
const { sendMailtoInventoryManager } = require("./sendmailbody");
const { isEmail } = require("validator");
const { Service } = require("aws-sdk");
const { MongoClient } = require("mongodb");

const validateEmail = (email) => {
  return isEmail(email);
};

async function validateServiceRequestData(data) {
  const {
    customer_name,
    customer_mobile,
    customer_email,
    odometer_reading,
    request_type,
    vehicle,
    issue_type,
  } = data;
  const errors = [];

  console.log(customer_name, customer_mobile, customer_email);

  if (!customer_name || customer_name.trim().length === 0) {
    errors.push("Customer name is required");
  }

  if (
    !customer_mobile ||
    isNaN(customer_mobile) ||
    customer_mobile.toString().length !== 10
  ) {
    errors.push(
      "Customer mobile number is required and should be a 10-digit number"
    );
  }

  if (!customer_email || !validateEmail(customer_email)) {
    errors.push("Invalid email address");
  }

  if (
    odometer_reading &&
    (odometer_reading === "" || isNaN(odometer_reading))
  ) {
    if (isNaN(odometer_reading))
      errors.push("Odameter Reading should be a number");
  }

  if (vehicle === "") {
    errors.push("Please provide vehicle number!");
  }

  if (request_type === "") {
    errors.push("Please provide Request Type!");
  }

  if (issue_type?.length == 0) {
    errors.push("Please Select Issue Type!");
  }

  return errors;
}

async function addServiceRequest(req, res) {
  try {
    let { vehicle, request_type, hub } = req.body.data;

    //check if the request_type of current body is present in db for the vehicle in ongoing requests ie whose status is not Done
    let ongoingRequests = await Service_Request.find({
      $and: [
        {
          $or: [
            { "status.to_do.check": true },
            { "status.in_progress.check": true },
          ],
        },
        { "status.done.check": false },
        { request_type },
        { vehicle },
      ],
    });

    console.log(ongoingRequests);

    // if present send these
    if (ongoingRequests.length > 0) {
      let resObj;
      resObj = {
        code: 409,
        message: [
          "Service Request for same request type is already In Progress. Cannot add another request until its done",
        ],
      };
      return resObj;
    }

    const validationErrors = await validateServiceRequestData(req.body.data);
    if (!hub) {
      validationErrors.push("Hub is required");
    }
    if (validationErrors.length > 0) {
      let resObj = { code: 400, message: validationErrors };
      return resObj;
    }

    //status should be To Do at first
    if (req.body.data.status !== "To Do") {
      let resObj = {
        code: 400,
        message: ["Status should be To Do at time of adding service request"],
      };
      return resObj;
    }

    console.log(req.body.data.status);

    //separate request_parts, status and rest of the data as we need request_parts for only Technican and Manager else it will be a empty string
    let srData;
    const { requested_parts, status, ...rest } = req.body.data;
    srData = {
      ...rest,
      assigned_to: {
        technician: req.body.data.assigned_to.name,
        id: req.body.data.assigned_to.id
      }
    };

    let role = req.user.role;
// if (role === "Technician") {
//   const { requested_parts, status, ...rest } = req.body.data;
//   srData = {
//     ...rest,
//     assigned_to: {
//       technician: req.body.data.assigned_to.name,
//       id: req.body.data.assigned_to.id
//     }
//   };
if (role === "Technician") {
  const { requested_parts, status, ...rest } = req.body.data;
  srData = rest;
  console.log(srData, "SR data for technician");
}


    // console.log(role, srData, "gfhg");

    //assignedTechnician will be string in empty string so convert it into dict for storing it in db
    // let today = new Date();
    // let ISTDate = new Date(today.getTime() + 5.5 * 60 * 60 * 1000);

    let ISTDate = new Date();
    ISTDate.setHours(ISTDate.getHours() + 5);
    ISTDate.setMinutes(ISTDate.getMinutes() + 30);
    if (role === "Manager"|| role === "Admin") {
      if (!req.body.data.assigned_to.name || !req.body.data.assigned_to.id) {
        let resObj = {
          code: 500,
          message: ["Please assign Technician first"],
        };
        return resObj;
      }
    
      if (srData) {
        srData.assigned_to = {
          check: true,
          technician: req.body.data.assigned_to.name,
          id: req.body.data.assigned_to.id,
          date_time: ISTDate,
        };
      }
    }

    //add the srData as record
    let record = new Service_Request(srData);
    record.created_by = req.user._id;

    let location = record.location;

    //store status.to_do for srData
    let to_do = {
      check: true,
      date_time: ISTDate,
    };

    // console.log(to_do);
    record.status.to_do = to_do;

    //return data after saving the srData//record
    let data = await record
      .save()
      .then(async (result) => {
        // await Service_Request.findOneAndUpdate(
        //   { _id: result._id },
        //   { $set: { ticket_id: `SR${result.ticket_no}` } }
        // );
        result.ticket_id = `SR${result.ticket_no}`;
        await result.save();
        let resObj = { code: 1, message: result };
        return resObj;
      })
      .catch((err) => {
        console.log(err);
        let resObj = {
          code: 500,
          message: [err.message],
        };
        return resObj;
      });

    let resObj = data;
    return resObj;
  } catch (error) {
    console.log(error);
    let resObj = {
      code: 500,
      message: [
        "Internal Server Error: Unable to register your service request",
      ],
    };
    return resObj;
  }
}

//add request of all vehciles for request_type: Monthly Service
async function addMonthlyServiceRequest(req, res) {
  try {
    let i = 1;
    let result = [];
    let location = "Bangalore";

    /*
    let file = req.file;
    // console.log(req.body, file);

    // use xlsx to convert buffer data into JSON
    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    console.log(jsonData.length); */

    /*
    for (let idx = 109471; idx <= 109922; idx++) {
      let data = await Service_Request.findOne({ ticket_no: idx });

      data.request_type = "Monthly Service";
      await data.save();

      console.log(`${idx} Done`);
    }*/

    let vehicleArr = [
      "NCRSH0035",
      "NCRSH0181",
      "NCRSH0086",
      "NCRSH0158",
      "NCRSH0029",
      "NCRSH0126",
      "NCRSS0030",
      "NCRSS0205",
      "NCRSS0526",
      "NCRSS0009",
      "NCRSS0013",
      "NCRSS0491",
      "NCRSS0294",
      "NCRSS0345",
      "NCRSS0273",
      "NCRSS0121",
      "NCRSS0007",
      "NCRSS0713",
      "NCRSS0293",
      "NCRSS0022",
      "NCRSS0321",
      "NCRSS0220",
      "NCRSS0147",
      "NCRSS0249",
      "NCRSS0288",
      "NCRSS0104",
      "NCRSS0359",
      "NCRSS0835",
      "NCRSS0479",
      "NCRSS0451",
      "NCRSS0010",
      "NCRSS0087",
      "NCRSS0073",
      "NCRSS0055",
      "NCRSS0596",
      "NCRSS0609",
      "NCRSS0179",
      "NCRSS0861",
      "NCRSS0565",
      "NCRSS0788",
      "NCRSS0424",
      "NCRSS0654",
      "NCRSS0595",
      "NCRSS0769",
      "NCRSS0789",
      "NCRSS0583",
      "NCRSS0048",
      "NCRSS0080",
      "NCRSS0065",
      "NCRSS0063",
      "NCRSS0624",
      "NCRSS0044",
      "NCRSS0042",
      "NCRSS0052",
      "NCRSS0060",
      "NCRSS0068",
      "NCRSS0054",
      "NCRSS0071",
      "NCRSS0692",
      "NCRSS0581",
      "NCRSS0586",
      "NCRFR0003",
      "NCRFR0192",
      "NCRFR0053",
      "NCRFR0098",
      "NCRFR0057",
      "NCRFR0159",
      "NCRFR0209",
      "NCRFR0180",
      "NCRFR0206",
      "NCRFR0145",
      "NCRFR0208",
      "NCRFR0024",
      "NCRFR0212",
      "NCRFR0213",
      "NCRFR0146",
      "NCRFR0168",
      "NCRFR0094",
      "NCRFR0147",
      "NCRFR0131",
      "NCRFR0328",
      "NCRFR0228",
      "NCRFR0220",
      "NCRFR0322",
      "NCRFR0284",
      "NCRFR0281",
      "NCRFR0243",
      "NCRFR0413",
      "NCRFR0319",
      "NCRFR0270",
      "NCRFR0365",
      "NCRFR0308",
      "NCRFR0407",
      "NCRFR0278",
      "NCRFR0371",
      "NCRFR0385",
      "NCRFR0366",
      "NCRSF0037",
      "NCRSF0047",
      "NCRSF0055",
      "NCRSF0088",
      "NCRSF0031",
      "NCRSF0135",
      "NCRSF0103",
      "NCRSF0143",
      "NCRSF0081",
      "NCRSF0046",
      "NCRSF0153",
      "NCRSF0034",
      "NCRSF0090",
      "NCRSF0094",
      "NCRSF0067",
      "NCRSF0106",
      "NCRSF0155",
      "NCRSF0095",
      "NCRSF0138",
      "NCRBZ0051",
      "NCRBZ0009",
      "NCRBZ0119",
      "NCRBZ0142",
      "NCRFR0356",
      "NCRSF0164",
      "NCRSF0156",
      "NCRSH0087",
      "NCRSH0159",
      "NCRSH0050",
      "NCRSH0042",
      "NCRSH0204",
      "NCRSH0083",
      "NCRSH0034",
      "NCRSH0076",
      "NCRSS0162",
      "NCRSH0224",
      "NCRSH0036",
      "NCRSH0190",
      "NCRSH0220",
      "NCRSH0041",
      "NCRSS0693",
      "NCRSS0559",
      "NCRSS0078",
      "NCRSS0613",
      "NCRSS0567",
      "NCRSS0563",
      "NCRSS0557",
      "NCRSS0561",
      "NCRSS0572",
      "NCRSS0058",
      "NCRSS0584",
      "NCRSS0659",
      "NCRSS0610",
      "NCRSS0422",
      "NCRSS0046",
      "NCRSS0162",
      "NCRSS0606",
      "NCRSS0649",
      "NCRSS0655",
      "NCRSS0168",
      "NCRSS0172",
      "NCRSS0614",
      "NCRSS0125",
      "NCRSH0111",
      "NCRFR0271",
      "NCRFR0417",
      "NCRFR0249",
      "NCRSS0413",
      "2103232384",
      "NCRFR0242",
      "NCRSH0123",
      "NCRFR0087",
      "NCRSS0446",
      "NCRFR0038",
      "NCRSS0005",
      "NCRFR0263",
      "NCRFR0071",
      "NCRFR0050",
      "NCRFR0090",
      "NCRFR0332",
      "NCRSF0104",
      "NCRSF0110",
      "NCRFR0061",
      "NCRFR0418",
      "NCRSS0395",
      "NCRSS0446",
      "NCRSS0390",
      "NCRSS0145",
      "NCRSF0000",
      "NCRFR0073",
      "NCRFR0034",
      "NCRSF0145",
      "NCRBZ0130",
      "NCRFR0321",
      "NCRSS0160",
      "NCRSS0506",
      "NCRSS0195",
      "NCRSS0533",
      "NCRSF0261",
      "NCRFR0162",
      "NCRSS0376",
      "NCRFR0007",
      "NCRFR0091",
      "NCRFR0202",
      "NCRFR0026",
      "NCRBZ0275",
      "NCRSS0898",
      "NCRFR0048",
      "NCRSS0304",
      "NCRSF0006",
      "NCRSS0278",
      "NCRSS0786",
      "NCRBZ0104",
      "NCRSS0261",
      "NCRFR0351",
      "NCRSH0120",
      "NCRFR0412",
      "NCRFR0373",
      "NCRFR0112",
      "NCRSS0679",
      "NCRSS0287",
      "NCRSS0256",
      "NCRSS0191",
      "NCRBZ0098",
      "NCRSS0534",
      "NCRSH0154",
      "NCRBZ0090",
      "NCRSF0045",
      "NCRBZ0112",
      "NCRFR0009",
      "NCRFR0134",
      "NCRFR0065",
      "NCRSS0368",
      "NCRSS0150",
      "NCRSH0117",
      "NCRBZ0069",
      "NCRFR0406",
      "NCRSS0529",
      "NCRSS0708",
      "NCRSS0355",
      "NCRSS0038",
      "NCRFR0205",
      "NCRBZ0193",
      "NCRSS0470",
      "NCRSF0078",
      "NCRSS0035",
      "NCRSS0212",
      "NCRSF0302",
      "NCRSH0104",
      "NCRSS0006",
      "NCRSS0102",
      "NCRSF0098",
      "NCRSS0248",
      "NCRSH0155",
      "NCRSH0146",
      "NCRSS0477",
      "NCRSS0827",
      "NCRSF0152",
      "NCRFR0059",
      "NCRSH0118",
      "NCRFR0054",
      "NCRSS0129",
      "NCRSS0817",
      "NCRFR0231",
      "NCRSS0671",
      "NCRSS0014",
      "NCRSS0680",
      "NCRBZ0231",
      "NCRBZ0005",
      "NCRBZ0026",
      "NCRBZ0002",
      "NCRSF0218",
      "NCRSF0076",
      "NCRSF0091",
      "NCRSF0068",
      "NCRSS0056",
      "NCRSH0196",
      "NCRFR0293",
      "NCRFR0252",
      "NCRBZ0097",
      "NCRBZ0167",
      "NCRSS0428",
      "NCRSS0342",
      "NCRSS0317",
      "NCRSS0091",
      "NCRSS0627",
      "NCRSS0454",
      "NCRSS0143",
      "NCRSS0394",
      "NCRSS0350",
      "NCRSS0492",
      "NCRSS0374",
      "NCRSS0750",
      "NCRSS0186",
    ];

    // let restVehicles = await Rider.find(
    //   { vehicle_no: { $nin: vehicleArr }, location },
    //   { vehicle_no: 1 }
    // );
    let restVehicles = await Rider.find(
      { location }
      // { vehicle_no: 1 }
    );
    console.log(restVehicles.length);

    let request_type = "Monthly Service";
    let userId = "6524e156a142f101109612e0";
    let technician = "ABHINANDAN";

    //check if the request_type of current body is present in db for the vehicle in ongoing requests ie whose status is not Done
    for (let vData of restVehicles) {
      // for (let idx = 0; idx < vehicleArr.length; idx++) {
      //   const vehicle = vehicleArr[idx];

      let newlyCreated = false;
      // let vehicle = vData["Bike No."].toUpperCase();
      let vehicle = vData.vehicle_no.toUpperCase();

      console.log(i, vehicle);
      i += 1;

      /*
      let hub = vData["Location"];
      if (hub === "HSR Layout") {
        technician = "Chandan";
      } */
      // console.log(vehicle, technician);

      let ongoingRequests = await Service_Request.findOne({
        $and: [
          {
            $or: [
              { "status.to_do.check": true },
              { "status.in_progress.check": true },
            ],
          },
          { "status.done.check": false },
          { request_type },
          { vehicle },
        ],
      });

      // console.log(ongoingRequests);

      if (ongoingRequests) {
        console.log(
          `${vehicle} ticket already addeed, ${ongoingRequests.ticket_id}`
        );
        result.push({
          vehicle,
          message: "Already Added",
          ticket: ongoingRequests.ticket_id,
        });
        continue;
      }

      let vehicleData = await Rider.findOne({ vehicle_no: vehicle });
      // console.log("veh", vehicleData);

      /*
      if (!vehicleData) {
        let rider = new Rider({
          name: "Vikas Goud",
          mob_number: 9390580178,
          email: "vikas@gmail.com",
          location: location,
          status: "Active",
          role: "Rider",
          owner: "Vikas Manager HYD",
          owner_email: "vikas@gmail.com",
          owner_mob: 9390580178,
          vehicle_no: vehicle,
        });

        await rider.save();

        newlyCreated = true;

        vehicleData = await Rider.findOne({ vehicle_no: vehicle });

        console.log(`Created new Rider for ${vehicle}`);
      }*/

      if (vehicleData) {
        issue_desc = "Monthly Service Ticket";
        console.log("issue", issue_desc);
        //add the srData as record
        let record = new Service_Request({
          customer_name: vehicleData.name,
          customer_mobile: vehicleData.mob_number,
          customer_email: vehicleData.email,
          vehicle: vehicle,
          location: location,
          odometer_reading: 0,
          request_type: request_type,
          issue_description: issue_desc,
          issue_photo: [],
          spare_parts: [],
          requested_parts: [],
          assigned_to: {
            check: true,
            technician: technician,
          },
        });
        record.created_by = userId;

        let today = new Date();
        let ISTDate = new Date(today.getTime() + 5.5 * 60 * 60 * 1000);

        //store status.to_do for srData
        let to_do = {
          check: true,
          date_time: ISTDate,
        };

        // console.log(to_do);
        record.status.to_do = to_do;

        //return data after saving the srData//record
        let data = await record
          .save()
          .then(async (resu) => {
            await Service_Request.findOneAndUpdate(
              { _id: resu._id },
              { $set: { ticket_id: `SR${resu.ticket_no}` } }
            );

            if (newlyCreated) {
              result.push({
                vehicle,
                message: "Ticket Added, Rider Added with Mrinal's credentials",
                ticket: `SR${resu.ticket_no}`,
                technician,
              });
            } else {
              result.push({
                vehicle,
                message: "Added",
                ticket: `SR${resu.ticket_no}`,
                technician,
              });
            }
            let resObj = {
              code: 1,
              message: `SR${resu.ticket_no} saved success, ${vehicle}`,
            };
            console.log(resObj);
            return resObj;
          })
          .catch((err) => {
            console.log(err);
            let resObj = {
              code: 500,
              message: [err.message],
            };
            console.log(resObj);
            return resObj;
          });

        let resObj = data;
        console.log(resObj);
        continue;
        // } else {
        //   result.push({
        //     vehicle,
        //     message: "Details Not found",
        //     ticket: null,
        //   });
        //   console.log(`${vehicle} Details Not found`);
        // }
      } else {
        console.log(`${vehicle} Details Not found`);
      }
    }

    console.log("result lenght", result.length);
    return res.status(200).json({ code: 1, message: result });
  } catch (error) {
    console.log(error);
    let resObj = {
      code: 500,
      message: [
        "Internal Server Error: Unable to register your service request",
      ],
    };
    console.log(resObj);
    return res.status(200).json(resObj);
  }
}

async function addMonthlyServiceRequestCron() {
  const dataToRaiseTicket = [
    {
      location: "NCR",
      managerId: "647a259e8abd704a40bd8380",
      techName: "Sandeep Paswan",
    },
    {
      location: "Kolkata",
      managerId: "64896651d0a54f44d19a81a9",
      techName: "Chhandak Barua",
    },
    {
      location: "Hyderabad",
      managerId: "64896571d0a54f44d19a81a5",
      techName: "Ganesh",
    },
    {
      location: "Chandigarh",
      managerId: "64a516e092d312e6ec2a4dbd",
      techName: "Gopi Rajput",
    },
    {
      location: "Bangalore",
      managerId: "6524e156a142f101109612e0",
      techName: "ABHINANDAN",
    },
  ];
  try {
    for (eachEle of dataToRaiseTicket) {
      try {
        let i = 1;
        let result = [];
        let location = eachEle.location;
        let restVehicles = await Rider.find(
          { location }
          // { vehicle_no: 1 }
        );

        let request_type = "Monthly Service";
        let userId = eachEle.managerId;
        let technician = eachEle.techName;

        //check if the request_type of current body is present in db for the vehicle in ongoing requests ie whose status is not Done
        for (let vData of restVehicles) {
          // for (let idx = 0; idx < vehicleArr.length; idx++) {
          //   const vehicle = vehicleArr[idx];

          let newlyCreated = false;
          // let vehicle = vData["Bike No."].toUpperCase();
          let vehicle = vData.vehicle_no.toUpperCase();

          console.log(i, vehicle);
          i += 1;

          /*
          let hub = vData["Location"];
          if (hub === "HSR Layout") {
            technician = "Chandan";
          } */
          // console.log(vehicle, technician);

          let ongoingRequests = await Service_Request.findOne({
            $and: [
              {
                $or: [
                  { "status.to_do.check": true },
                  { "status.in_progress.check": true },
                ],
              },
              { "status.done.check": false },
              { request_type },
              { vehicle },
            ],
          });

          // console.log(ongoingRequests);

          if (ongoingRequests) {
            console.log(
              `${vehicle} ticket already addeed, ${ongoingRequests.ticket_id}`
            );
            result.push({
              vehicle,
              message: "Already Added",
              ticket: ongoingRequests.ticket_id,
            });
            continue;
          }

          let vehicleData = await Rider.findOne({ vehicle_no: vehicle });

          if (vehicleData) {
            issue_desc = "Monthly Service Ticket";
            console.log("issue", issue_desc);
            //add the srData as record
            let record = new Service_Request({
              customer_name: vehicleData.name,
              customer_mobile: vehicleData.mob_number,
              customer_email: vehicleData.email,
              vehicle: vehicle,
              location: location,
              odometer_reading: 0,
              request_type: request_type,
              issue_description: issue_desc,
              issue_photo: [],
              spare_parts: [],
              requested_parts: [],
              assigned_to: {
                check: true,
                technician: technician,
              },
            });
            record.created_by = userId;

            let today = new Date();
            let ISTDate = new Date(today.getTime() + 5.5 * 60 * 60 * 1000);

            //store status.to_do for srData
            let to_do = {
              check: true,
              date_time: ISTDate,
            };

            // console.log(to_do);
            record.status.to_do = to_do;

            //return data after saving the srData//record
            let data = await record
              .save()
              .then(async (resu) => {
                await Service_Request.findOneAndUpdate(
                  { _id: resu._id },
                  { $set: { ticket_id: `SR${resu.ticket_no}` } }
                );

                if (newlyCreated) {
                  result.push({
                    vehicle,
                    message:
                      "Ticket Added, Rider Added with Mrinal's credentials",
                    ticket: `SR${resu.ticket_no}`,
                    technician,
                  });
                } else {
                  result.push({
                    vehicle,
                    message: "Added",
                    ticket: `SR${resu.ticket_no}`,
                    technician,
                  });
                }
                let resObj = {
                  code: 1,
                  message: `SR${resu.ticket_no} saved success, ${vehicle}`,
                };
                console.log(resObj);
                return resObj;
              })
              .catch((err) => {
                console.log(err);
                let resObj = {
                  code: 500,
                  message: [err.message],
                };
                console.log(resObj);
                return resObj;
              });

            let resObj = data;
            console.log(resObj);
            continue;
          } else {
            console.log(`${vehicle} Details Not found`);
          }
        }

        console.log("result lenght", result.length);
      } catch (error) {
        console.log(error);
      }
    };
  } catch (error) {
    console.log(error);
  }
}

//not in use
async function technicianAddRequest(req, res) {
  try {
    await addServiceRequest(req, res);
    let invetoryManagerDetails = await User.find({
      location,
      role: "Inventory Manager",
    });

    //mail Inventory Manager
    if (!invetoryManagerDetails) {
      console.log("Could Not Find Inventory Manager");
      return 0;
    }
    console.log("m", invetoryManagerDetails);

    let invetoryManagerMail = invetoryManagerDetails[0].email;

    await sendMailtoInventoryManager(
      invetoryManagerMail,
      technician,
      requestedParts,
      ticket_id
    )
      .then((result) => {
        res.status(200).json({ message: `Mail Sent to Inventory Manager` });
      })
      .catch((err) => {
        res.status(500).send("Could not send email to Inventory Manager");
      });
  } catch (error) {
    res
      .status(500)
      .send("Internal Server Error : Unable to register your service request.");
  }
}

async function addIotServiceRequest(req, res) {
  try {
    let i = 1;
    let result = [];
    let location = "Hyderabad";

    /*
    let file = req.file;
    // console.log(req.body, file);

    // use xlsx to convert buffer data into JSON
    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    console.log(jsonData.length); */

    /*
    for (let idx = 109471; idx <= 109922; idx++) {
      let data = await Service_Request.findOne({ ticket_no: idx });

      data.request_type = "Monthly Service";
      await data.save();

      console.log(`${idx} Done`);
    }*/

    let vehicleArr = [
      "HYDFR0021",
      "HYDFR0023",
      "HYDFR0024",
      "HYDFR0026",
      "HYDFR0029",
      "HYDFR0030",
      "HYDFR0033",
      "HYDFR0035",
      "HYDFR0037",
      "HYDFR0039",
      "HYDFR0041",
      "HYDFR0042",
      "HYDFR0044",
      "HYDFR0045",
      "HYDFR0046",
      "HYDFR0047",
      "HYDFR0048",
      "HYDFR0050",
      "HYDFR0052",
      "HYDFR0053",
      "HYDFR0056",
      "HYDFR0066",
      "HYDFR0073",
      "HYDFR0076",
      "HYDSF0007",
      "HYDSF0010",
      "HYDSF0019",
      "HYDSF0031",
      "HYDSF0037",
      "HYDSF0040",
      "HYDSF0046",
      "HYDSF0048",
      "HYDSF0058",
      "HYDSF0060",
      "HYDSF0071",
      "HYDSF0077",
      "HYDSF0082",
      "HYDSF0084",
      "HYDSF0087",
      "HYDSF0091",
      "HYDSF0096",
      "HYDSF0099",
      "HYDSF0100",
      "HYDSF0103",
      "HYDSF0105",
      "HYDSF0108",
      "HYDSF0109",
      "HYDSF0112",
      "HYDSF0120",
      "HYDSF0123",
      "HYDSF0126",
      "HYDSF0127",
      "HYDSF0131",
      "HYDSF0137",
      "HYDSF0140",
      "HYDSF0142",
      "HYDSF0151",
      "HYDSF0159",
      "HYDSF0160",
      "HYDBZ0005",
      "HYDBZ0030",
      "HYDBZ0036",
      "HYDBZ0045",
      "HYDBZ0046",
      "HYDBZ0052",
      "HYDBZ0055",
      "HYDBZ0060",
      "HYDBZ0063",
      "HYDBZ0075",
      "HYDBZ0076",
      "HYDBZ0081",
      "HYDBZ0084",
      "HYDBZ0086",
      "HYDBZ0093",
      "HYDBZ0099",
      "HYDBZ0100",
      "HYDBZ0102",
      "HYDBZ0115",
      "HYDBZ0126",
      "HYDBZ0129",
      "HYDBZ0132",
      "HYDBZ0143",
      "HYDSH0003",
      "HYDSH0007",
      "HYDSH0035",
      "HYDSH0037",
      "HYDSH0038",
      "HYDSH0064",
      "HYDSH0070",
      "HYDSH0074",
    ];

    let restVehicles = await Rider.find(
      { vehicle_no: { $in: vehicleArr }, location },
      { vehicle_no: 1 }
    );
    // let restVehicles = await Rider.find(
    //   { location }
    //   // { vehicle_no: 1 }
    // );
    console.log(restVehicles.length);

    let request_type = "Service Related";
    let userId = "64896571d0a54f44d19a81a5";
    let technician = "T.Sridhar Goud";

    //check if the request_type of current body is present in db for the vehicle in ongoing requests ie whose status is not Done
    for (let vData of restVehicles) {
      // for (let idx = 0; idx < vehicleArr.length; idx++) {
      //   const vehicle = vehicleArr[idx];

      let newlyCreated = false;
      // let vehicle = vData["Bike No."].toUpperCase();
      let vehicle = vData.vehicle_no.toUpperCase();

      console.log(i, vehicle);
      i += 1;

      /*
      let hub = vData["Location"];
      if (hub === "HSR Layout") {
        technician = "Chandan";
      } */
      // console.log(vehicle, technician);

      let ongoingRequests = await Service_Request.findOne({
        $and: [
          {
            $or: [
              { "status.to_do.check": true },
              { "status.in_progress.check": true },
            ],
          },
          { "status.done.check": false },
          { request_type },
          { vehicle },
        ],
      });

      // console.log(ongoingRequests);

      if (ongoingRequests) {
        console.log(
          `${vehicle} ticket already addeed, ${ongoingRequests.ticket_id}`
        );
        result.push({
          vehicle,
          message: "Already Added",
          ticket: ongoingRequests.ticket_id,
        });
        continue;
      }

      let vehicleData = await Rider.findOne({ vehicle_no: vehicle });
      // console.log("veh", vehicleData);

      /*
      if (!vehicleData) {
        let rider = new Rider({
          name: "Vikas Goud",
          mob_number: 9390580178,
          email: "vikas@gmail.com",
          location: location,
          status: "Active",
          role: "Rider",
          owner: "Vikas Manager HYD",
          owner_email: "vikas@gmail.com",
          owner_mob: 9390580178,
          vehicle_no: vehicle,
        });

        await rider.save();

        newlyCreated = true;

        vehicleData = await Rider.findOne({ vehicle_no: vehicle });

        console.log(`Created new Rider for ${vehicle}`);
      }*/

      if (vehicleData) {
        issue_desc = "Iot Not Working";
        console.log("issue", issue_desc);
        //add the srData as record
        let record = new Service_Request({
          customer_name: vehicleData.name,
          customer_mobile: vehicleData.mob_number,
          customer_email: vehicleData.email,
          vehicle: vehicle,
          location: location,
          odometer_reading: 0,
          request_type: request_type,
          issue_description: issue_desc,
          issue_photo: [],
          spare_parts: [],
          requested_parts: [],
          assigned_to: {
            check: true,
            technician: technician,
          },
        });
        record.created_by = userId;

        let today = new Date();
        let ISTDate = new Date(today.getTime() + 5.5 * 60 * 60 * 1000);

        //store status.to_do for srData
        let to_do = {
          check: true,
          date_time: ISTDate,
        };

        // console.log(to_do);
        record.status.to_do = to_do;

        //return data after saving the srData//record
        let data = await record
          .save()
          .then(async (resu) => {
            await Service_Request.findOneAndUpdate(
              { _id: resu._id },
              { $set: { ticket_id: `SR${resu.ticket_no}` } }
            );

            if (newlyCreated) {
              result.push({
                vehicle,
                message: "Ticket Added, Rider Added with Mrinal's credentials",
                ticket: `SR${resu.ticket_no}`,
                technician,
              });
            } else {
              result.push({
                vehicle,
                message: "Added",
                ticket: `SR${resu.ticket_no}`,
                technician,
              });
            }
            let resObj = {
              code: 1,
              message: `SR${resu.ticket_no} saved success, ${vehicle}`,
            };
            console.log(resObj);
            return resObj;
          })
          .catch((err) => {
            console.log(err);
            let resObj = {
              code: 500,
              message: [err.message],
            };
            console.log(resObj);
            return resObj;
          });

        let resObj = data;
        console.log(resObj);
        continue;
        // } else {
        //   result.push({
        //     vehicle,
        //     message: "Details Not found",
        //     ticket: null,
        //   });
        //   console.log(`${vehicle} Details Not found`);
        // }
      } else {
        console.log(`${vehicle} Details Not found`);
      }
    }

    console.log("result lenght", result.length);
    return res.status(200).json({ code: 1, message: result });
  } catch (error) {
    console.log(error);
    let resObj = {
      code: 500,
      message: [
        "Internal Server Error: Unable to register your service request",
      ],
    };
    console.log(resObj);
    return res.status(200).json(resObj);
  }
}



module.exports = {
  addServiceRequest,
  addMonthlyServiceRequest,
  technicianAddRequest,
  validateServiceRequestData,
  addMonthlyServiceRequestCron,
};
