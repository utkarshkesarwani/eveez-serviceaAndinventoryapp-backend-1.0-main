const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const xlsx = require("xlsx");
const axios = require("axios");
const router = express.Router();
const { logroute } = require("../logger/lgs");
const Service_Request = require("../model/servicerequest");

const Location = require("../model/location");

const User = require("../model/user");
const Rider = require("../model/rider");
const NonExistingVehicle = require("../model/nonexistingvehicle.js");
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: "tech@eveez.in",
    pass: "orxedzevitsxecjr",
  },
});
// const VehDetails = require("../model/vehDetails");
const Plan = require("../model/plan");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const QRCode = require("../model/qrCode");

const db = mongoose.connection;

const {
  getOpenServiceRequest,
  getClosedServiceRequest,
  getAllServiceRequest,
  getAllMISServiceRequest,
  getOpenTicketsCount,
} = require("../controllers/AllopenAndClosedSRs");
const { TechnicianForLoc } = require("../controllers/technicanforloc");
const { getLocationwiseSRs } = require("../controllers/locationwiseSRs");
const { isAuthenticated } = require("../middlewares/auth");
const InventoryCount = require("../model/inventoryCount");
const InventoryDetails = require("../model/inventoryDetails");
const { sendEmail } = require("../middlewares/sendEmail");
const { StockOutOperation } = require("../controllers/stockoutinventory");
const {
  getVehIdforRider,
  getVehIdforOwner,
  getAllVehId,
} = require("../controllers/getvehicleid");
const {
  assignTechnician,
  checkTechnicianAlreadyAssigned,
} = require("../controllers/editManager");
const { mailtomanager } = require("../controllers/mailit");
const {
  getRiderOngoingServiceRequest,
  getRiderCompleteServiceRequest,
  getTechnicianOpenServiceRequest,
  getTechnicianCompleteServiceRequest,
  getOwnerOngoingServiceRequest,
  getOwnerCompleteServiceRequest,
  getTechnicianAllServiceRequest,
  getRiderAllServiceRequest,
  getOwnerAllServiceRequest,
} = require("../controllers/customeropenclosedSR");
const {
  addServiceRequest,
  technicianAddRequest,
  validateServiceRequestData,
  addMonthlyServiceRequest,
} = require("../controllers/addservicerequest");

const {
  changeVehicleStatus,
  change_Vehicle_Status_To_RFD,
} = require("../controllers/vehicleStatusChange");
const {
  sendMailtoInventoryManager,
  sendMailtoManager,
  sendTechnicianMailtoManager,
} = require("../controllers/sendmailbody");
const { requestParts } = require("../controllers/requestpartstechnician");
const { dict } = require("../controllers/oemMapping");
const { vehicleDetails } = require("../model/vehDetails");
const Part = require("../model/part");
const {
  getProductByMakeAndProductName,
  calculateDistance,
} = require("../controllers/findobject");
const {
  generateUploadURL,
  uploadImagesToS3,
} = require("../controllers/s3upload");
const { searchByVehicleid } = require("../controllers/searchrequests");
const {
  getRequestsStats,
  getLastSixMonthsStats,
} = require("../controllers/requeststats");
const {
  getServiceRecords,
  getRiderServiceRecords,
  getOwnerServiceRecords,
  getTechnicianServiceRecords,
  getEmployeeServiceRecords,
} = require("../controllers/servicerecords");
const { errorMonitor, isErrored } = require("nodemailer/lib/xoauth2");
const {
  createPlan,
  getAllPlans,
  getPlanDetails,
} = require("../controllers/plan");
const {
  serviceRequestParts,
  serviceRequestPartsImage,
  getAllServiceRequests,
  customerLinkUsedPart,
  ticketsPerHour,
  addAppsRequest,
  getServiceDataBasedOnQuery,
  deleteServiceData,
} = require("../controllers/servicerequest");
const { tripData } = require("../model/tripdata");
const Counter = require("../model/counter");
const { requestTypeDetail } = require("../model/requestType");
const { getRequestsDone } = require("../controllers/getRequestsDone");
const {
  serviceHistory,
  updateTicketsToOtherTechnician,
} = require("../controllers/roughRiders");
const { hubExchangeOperation } = require("../controllers/hubexchange");
const {
  getTodayLocAndStatus,
  getWeeklyTechnicianData,
  getWeeklyServiceRequests,
  getDailyTechnicianData,
  getMonthlyTechnicianData,
  deepCopy,
  getServiceRequestStats,
} = require("../controllers/servicestats");
const {
  getNotAssignedRequests,
  getStillInProgressRequests,
  getNotDoneRequests,
} = require("../controllers/pendingSRs");
const {
  getAllIssueType,
  createIssueType,
} = require("../controllers/issueTypeCRUD");
const { getRequestTypesCount } = require("../controllers/requestType");
const { getIssueTypesCount } = require("../controllers/issueType");
const addCustomerReview = require("../controllers/addCustomerReview");
const {
  getAverageTime,
  getOnTimeAndDelayedTasks,
  getWeeklyAnalysis,
  technicianPerformance,
} = require("../controllers/technician");

const { sparepartspricelist } = require("../model/sparePartsPriceList");
const { updatePartsPrice, partsPrice } = require("../controllers/parts");
const dates = require("../utils/date");

const { startTime, currectTime, lastWeek, currentMonth, lastThirtyDays } =
  dates.getDifferentTimePeriods();


router.post("/nonexistingvehicle", isAuthenticated, async (req, res) => {
  try {
    const { data, key, token } = req.body;

    if (!data || !key || !token) {
      return res
        .status(400)
        .json({ message: "Missing required fields in the payload." });
    }

    const vehicleDetails = new NonExistingVehicle({
      name: data.name,
      vehicle_no: data.vehicle_no,
      mob_number: data.mob_number,
      email: data.email,
      location: data.location,
      message: data.message,
      chassis_number: data.chassis_number,
      // key,
      // token,
    });

    const savedVehicle = await vehicleDetails.save();

    // email
    const mailOptions = {
      from: "tech@eveez.in",
      to: "test@gmail.com",
      subject: "New Vehicle Details Added",
      text: `
        Vehicle Details:
        Name: ${data.name}
        Vehicle No: ${data.vehicle_no}
        Mobile Number: ${data.mob_number}
        Email: ${data.email}
        Location: ${data.location}
        chassis_number: ${data.chassis_number}
        Message: ${data.message}
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Return success response
    res.status(200).json({
      message: "Vehicle details saved successfully and email sent.",
      vehicle: savedVehicle,
    });
  } catch (error) {
    console.error("Error in /nonexistingvehicle route:", error);
    res.status(500).json({ message: `Error: ${error.message}` });
  }
});

router.post("/addrequest", isAuthenticated, async (req, res) => {
  logroute(req);

  let ticketId = undefined;
  try {
    let resObj;
    let role = req.user.role;
    // console.log(role);
    if (role === "Technician") {
      const { requested_parts, ...rest } = req.body.data;
      if (req.body.data.location === "Bengaluru") {
        req.body.data.location = "Bangalore";
      }
      const data = await addServiceRequest(req, res);
      console.log(data, "data");
      if (data.code !== 1) {
        return res.status(data.code).json({ code: 0, message: [data.message] });
      }
      let srData = data.message;
      ticketId = `SR${srData.ticket_no}`;
      console.log(ticketId);
      let technician = req.body.data.assigned_to;
      let location = req.user.location;

      // console.log(technician);

      srData.assigned_to = {
        technician,
        id: req.user._id,
        check: true,
        date_time: currectTime,
      };

      await srData.save();
      const managerDetails = await User.findOne(
        {
          location,
          role: "Manager",
        },
        {
          email: 1,
        }
      );
      if (!managerDetails) {
        console.log("Could Not Find Manager");
        return res
          .status(404)
          .send(["Could Not Find Manager for your location"]);
      }
      console.log("m", managerDetails);

      let managerEmail = managerDetails.email;

      await sendTechnicianMailtoManager(managerEmail, technician, srData)
        .then(async (result) => {
          // console.log(data);
          console.log("datafgsvcbnd", ticketId);
          // console.log(srData, "shgsg");
          let requestedParts = data.message.requested_parts;

          //send mail to Inventory Manager if request_parts.length>0 else send mail to Manager
          if (requested_parts.length > 0) {
            //call function requestParts after sending mail to manager
            resObj = await requestParts(
              ticketId,
              requested_parts,
              technician,
              location
            );

            console.log(resObj, "res");

            if (resObj.code === 1) {
              // ADD HUB APP STATUS LOGIC HERE................
              await changeVehicleStatus(req.body.data.vehicle);
              res.status(200).json({
                code: 1,
                message: [
                  `Service Request Booked successfully and Mail sent to Inventory Manager`,
                ],
                details: { ...resObj.details._doc, latestStatus: "To Do" },
              });
            } else {
              res.status(resObj.code).json({
                code: 0,
                message: [resObj.message],
              });
              if (ticketId) {
                await Service_Request.deleteOne({ ticket_id: ticketId });
              }
            }
          } else {
            // ADD HUB APP LOGIC HERE..........
            await changeVehicleStatus(req.body.data.vehicle);
            res.status(200).json({
              code: 1,
              message: [`Service Request Booked successfully`],
              details: { ...srData._doc, latestStatus: "To Do" },
            });
          }
        })
        .catch(async (err) => {
          console.log(err);
          await Service_Request.deleteOne({ ticket_id: ticketId });
          res.status(400).json({
            code: 0,
            message: ["Could not send email to Manager"],
          });
          return;
        });
    } else if (role === "Manager") {
      if (req.body.data.location === "Bengaluru") {
        req.body.data.location = "Bangalore";
      }
      const dataObj = await addServiceRequest(req, res);

      console.log(dataObj, "data");
      // await changeVehicleStatus(req.body.data.vehicle);

      if (dataObj.code !== 1) {
        res.status(dataObj.code).json({ code: 0, message: [dataObj.message] });
        return;
      }
      let data = dataObj.message;

      let { requested_parts } = req.body.data;

      const ticketId = `SR${data.ticket_no}`;
      const technicianId = req.body.data.assigned_to.id;
      const technician = req.body.data.assigned_to.name;


      console.log(ticketId, technician, "Ticketid and tech name");

      let resObj = await assignTechnician(ticketId, technicianId);

      // console.log(resObj);

      if (resObj.code === 1) {
        // console.log("hdgfh");
        if (requested_parts.length !== 0) {
          // console.log("fjbhfv");
          //if requested_parts array is not empty call the function else sent the response
          let location = req.user.location;
          let resultObj = await requestParts(
            ticketId,
            requested_parts,
            technician,
            location
          );

          // console.log("obj", resultObj);
          if (resultObj.code === 1) {
            // hubapp vehicle status change
            await changeVehicleStatus(req.body.data.vehicle);
            res.status(200).json({
              code: 1,
              message: [
                `Service Request Booked successfully and Mail sent to Inventory Manager`,
              ],
              details: { ...resObj.details._doc, latestStatus: "To Do" },
            });
          } else {
            console.log(bghhg);
            res
              .status(resultObj.code)
              .json({ code: 0, message: [resultObj.message] });
            return;
          }
        } else {
          // hubapp vehicle status change
          await changeVehicleStatus(req.body.data.vehicle);

          //if requested_parts array is empty send the reponse with request details
          res.status(200).json({
            code: 1,
            message: [resObj.message],
            details: { ...resObj.details._doc, latestStatus: "To Do" },
          });
          return;
        }
      } else {
        res.status(resObj.code).json({ code: 0, message: [resObj.message] });
      }
    }
    //for employee, owner/customer and rider
    else {
      if (req.body.data.location === "Bengaluru") {
        req.body.data.location = "Bangalore";
      }
      let resData = await addServiceRequest(req, res);

      console.log(resData, "datafbf");

      if (resData.code === 1) {
        // console.log(data);
        let data = resData.message;
        let location = req.user.location;

        //mail manager
        const managerDetails = await User.findOne(
          {
            location,
            role: "Manager",
          },
          {
            email: 1,
          }
        );
        if (!managerDetails) {
          console.log("Could Not Find Manager");
          res.status(404).send(["Could Not Find Manager"]);
          return;
        }
        console.log("m", managerDetails);

        let managerEmail = managerDetails.email;

        await sendMailtoManager(managerEmail, data)
          .then(async (result) => {
            // hubapp vehicle status change
            await changeVehicleStatus(req.body.data.vehicle);
            res.status(200).json({
              code: 1,
              message: [`Service Request Booked successfully`],
              details: { ...resData.message._doc, latestStatus: "To Do" },
            });
          })
          .catch((err) => {
            res
              .status(500)
              .json({ code: 0, message: ["Could not send email to Manager"] });
            return;
          });
      } else {
        return res
          .status(resData.code)
          .json({ code: 0, message: [resData.message] });
      }
    }
  } catch (error) {
    if (ticketId) {
      await Service_Request.deleteOne({ ticket_id: ticketId });
    }
    console.log(error);
    res.status(500).json({ code: 0, message: [`Error: ${error}`] });
  }
});

router.post("/updaterequest", isAuthenticated, async (req, res) => {
  logroute(req);

  try {
    // console.log(req.body.data);
    const { ticket_id, status, new_parts_images, ...updateData } =
      req.body.data;
    let data = req.body.data;
    // let location = record.location;
    console.log(ticket_id, status);

    if (ticket_id === undefined) {
      res.status(404).json({ code: 0, message: "Please enter Ticket ID" });
      return;
    }

    const existingRequest = await Service_Request.findOne({ ticket_id });

    if (!existingRequest) {
      res.status(404).json({ code: 0, message: "Service request not found" });
      return;
    }

    // let today = new Date();
    // let ISTDate = new Date(today.getTime() + 5.5 * 60 * 60 * 1000);
    let ISTDate = new Date();
    ISTDate.setHours(ISTDate.getHours() + 5);
    ISTDate.setMinutes(ISTDate.getMinutes() + 30);

    if (req.body.data.status === "In Progress") {
      existingRequest.status.in_progress.check = true;
      existingRequest.status.in_progress.date_time = ISTDate;
    } else if (req.body.data.status === "Done") {
      existingRequest.status.done.check = true;
      existingRequest.status.done.date_time = ISTDate;
      existingRequest.closure_date = ISTDate;

      //mail Manager
      try {
        const managerDetails = await User.findOne(
          {
            location: existingRequest.location,
            role: "Manager",
          },
          {
            email: 1,
          }
        );

        if (!managerDetails) {
          console.log("Could Not Find Manager");
          res
            .status(500)
            .json({ code: 0, message: "Could not send email to Manager" });
          console.log(error);
          return;
        }
        // console.log("m", managerDetails);

        let managerEmail = managerDetails.email;
        const message = `Dear Branch Manager, Service Request ${existingRequest.ticket_id} has been completed. Service Request Details:, VehicleID: ${existingRequest.vehicle}

        Asset Details:

        Asset: ${existingRequest.vehicle},
        Customer Name: ${existingRequest.customer_name}
        Customer Mobile: ${existingRequest.customer_mobile}
        Odometer Reading: ${existingRequest.odometer_reading},
        Request_Type: ${existingRequest.request_type}
        Description: ${existingRequest.issue_description}`;

        await sendEmail({
          email: managerEmail,
          subject: `Service Request Completed! VehicleID: ${existingRequest.vehicle}`,
          message,
        });
      } catch (error) {
        // res
        //   .status(500)
        //   .json({ code: 0, message: "Could not send email to Manager" });
        // console.log(error);
        // return;
        console.log(error);
      }
    } else if (req.body.data.status === "To Do") {
      existingRequest.status.in_progress.check = false;
      existingRequest.status.in_progress.date_time = null;

      existingRequest.status.to_do.check = true;
      existingRequest.status.to_do.date_time = ISTDate;
    } else if (req.body.data.status === "Cancel") {
      existingRequest.status.cancel.check = true;
      existingRequest.status.cancel.date_time = ISTDate;
      existingRequest.status.cancel.reason = req.body.data.reason;
    }

    if (req.body.data.assignedDate) {
      const tempTime = new Date(req.body.data.assignedDate).getTime();
      const currentTime = tempTime + 5.5 * 60 * 60 * 1000;
      console.log(new Date(req.body.data.assignedDate), "hello");
      existingRequest.status.to_do.date_time = new Date(new Date(currentTime));
      existingRequest.assigned_to.date_time = new Date(new Date(currentTime));
    }

    Object.entries(updateData).forEach(([key, value]) => {
      if (
        key !== "date" && 
        key != "ticket_id" &&
        key != "issue_photo" &&
        key != "spare_parts" &&
        key != "requested_parts" &&
        key != "vehicle_image" &&
        value !== "" &&
        value !== null &&
        value != []
      ) {
        existingRequest[key] = value;
      } else if (key === "issue_photo" && value != []) {
        for (photoLink of value) {
          existingRequest[key].push(photoLink);
        }
      } else if (key === "vehicle_image" && value != []) {
        // let tempArr = [];
        // for (const key of Object.keys(value)) {
        //   tempArr.push({
        //     name: key,
        //     image: value[key],
        //   });
        // }

        // Check if existingRequest[key] is defined, initialize if not
        // if (!existingRequest[key]) {
        //   existingRequest[key] = [];
        // }
        existingRequest[key] = [...value];
      }
    });

    console.log(existingRequest, "before");

    // Add new_parts_images to the existing request
    if (new_parts_images && Array.isArray(new_parts_images)) {
      existingRequest.new_parts_images = new_parts_images;
    }

    await existingRequest
      .save()
      .then(async (result) => {
        // Handle successful update

        // console.log(result);

        let latestStatus = "";
        if (existingRequest["status"].done.check) {
          latestStatus = "Done";
        } else if (
          existingRequest["status"].to_do.check &&
          existingRequest["status"].in_progress.check
        ) {
          latestStatus = "In Progress";
        } else {
          latestStatus = "To Do";
        }

        if (latestStatus) {
          try {
            const updateInApp = await axios.put(
              `${process.env.APP_URL}/asset/service/update`,
              {
                ticket_id: result?.ticket_id,
                status: latestStatus,
              }
            );

            //Change status in Hub App.
          } catch (error) {
            console.log(error);
          }
        }

        if (latestStatus == "Done") {
          Promise.all([
            axios.post(`${process.env.HubApp_URL}/updateVehicleStatus`, {
              vehicleCode: existingRequest.vehicle,
              status: "RFD",
            }),
          ])
            .then((results) => {
              results.forEach((result) => {
                console.log(result.data, latestStatus);
              });
            })
            .catch((error) => {
              console.error(error, "Error in Promise.all:");
            });
        }

        res.status(200).json({
          code: 1,
          message: "Updated Service Request Details!",
          details: { ...existingRequest._doc, latestStatus },
        });
        return;
      })
      .catch((error) => {
        // Handle error
        console.error("Error updating document:", error);
        res.status(400).json({
          code: 0,
          message: `Unable to Update Service Request Details! Error: ${error.message}`,
        });
      });
  } catch (error) {
    res
      .status(500)
      .json("Internal Server Error : Unable to register your service request.");
    console.log(error);
  }
});

router.post("/addtechnician", async (req, res) => {
  logroute(req);
  try {
    let record = new Technician(req.body.data);
    let data = record
      .save()
      .then(() => {
        res.status(200).send("New Technician Added!");
      })
      .catch((err) => {
        res.status(500).send("Database Error : Unable to Add Technician.");
      });
  } catch (error) {
    res.status(500).send("Internal Server Error : Unable to Add Technician");
  }
});

// router.post("/addlocation", async (req, res) => {
//   logroute(req);
//   // try {
//   //   let record = new Location(req.body.data);
//   //   let data = record
//   //     .save()
//   //     .then(() => {
//   //       res.status(200).send("New Location Added!");
//   //     })
//   //     .catch((err) => {
//   //       res.status(500).send("Database Error : Unable to Add Location.");
//   //     });
//   // } catch (error) {
//   //   res.status(500).send("Internal Server Error : Unable to Add Location");
//   // }
// });

router.post("/unassignedrequests", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    let unassignedObj = [];
    let location = req.user.location;

    let Data = await Service_Request.find({
      "assigned_to.check": false,
      location,
    });

    console.log(Data);

    Data.map(async (ele) => {
      let ticketId = ele["ticket_id"];
      let vehicleID = ele["vehicle"];
      let date = ele["date"];
      let customerName = ele["customer_name"];
      let type = ele["request_type"];
      let status = "";

      if (ele["status"].to_do.check && ele["status"].in_progress.check) {
        status = "In Progress";
      } else {
        status = "To Do";
      }

      unassignedObj.push({
        ticketId,
        vehicleID,
        customerName,
        type,
        date,
        status,
      });
    });
    res.status(200).send(unassignedObj);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/stockininventory", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    const role = req.user.role;
    let details = req.body.data;
    let location = req.user.location;

    if (
      role !== "Inventory Manager" &&
      role !== "Manager" &&
      role !== "Technician"
    ) {
      return res.status(401).send("Not Authorized to perform this Operation");
    }

    // Add location to details
    details.location = location;

    // If role is Inventory Manager, add hub_id
    // if (role === "Inventory Manager") {
    //   details.hub_id = req.user.hub_id;
    // }

    details.hub_id = req.user.hub_id;

    // Validate parts count
    for (const ele of details.parts) {
      if (ele["count "] <= 0) {
        res.status(500).json({
          code: 0,
          message: `${ele["make "]}, ${ele.product_name} count should be greater than 0`,
        });
        return;
      }
    }

    // Save the record
    let record = new InventoryDetails(details);

    record
      .save()
      .then(() => {
        res.status(200).json({ code: 1, message: "New Record Added!" });
      })
      .catch((err) => {
        res.status(500).json({
          code: 0,
          message: `Database Error : Unable to Add Inventory Details. ${err.message}`,
        });
        return;
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ code: 0, message: `Error: ${error.message}` });
  }
});
// Route for updating the inventory count
router.post("/updateinventorycount", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    const role = req.user.role;
    const location = req.user.location;
    const hubIds = req.user.hub_id;
    const { parts } = req.body.data;

    // if (role !== "Inventory Manager" && role !== "Manager") {
    //   return res.status(401).send("Not Authorized to perform this Operation");
    // }

    for (const part of parts) {
      const { make, product_name, count } = part;

      console.log("part", { make, product_name, count });

      const parsedCount = parseInt(count, 10);
      console.log(parsedCount, "ParseCount");
      if (!make || !product_name || isNaN(parsedCount) || parsedCount <= 0) {
        return res.status(400).json({
          code: 0,
          message:
            "Invalid parts data. Make, product_name, and count are required, and count should be greater than 0.",
        });
      }

      const query = {
        product_name,
        make,
        location,
        ...(role === "Manager" ? {} : { hub_id: { $in: hubIds } }),
      };

      // const updateCount = {$inc:{'count': parsedCount}};
      const inventoryItem = await InventoryCount.findOne(query);
      console.log(inventoryItem, "InventoryItem");

      if (inventoryItem) {
        // console.log("previous invent",inventoryItem);
        const currentCount = inventoryItem.count || 0;
        inventoryItem.count = currentCount + parsedCount;
        await inventoryItem.save();
      } else if (!inventoryItem) {
        const newInventoryItem = new InventoryCount({
          product_name,
          make,
          hub_id: hubIds,
          location,
          count: count,
        });
        await newInventoryItem.save();
      }

      // res.status(200).json({
      //   code: 1,
      //   message: `${make}, ${product_name} inventory count successfully updated. New count: ${inventoryItem.count}`,
      // });
    }
    res.status(200).json({
      code: 1,
      message: `Inventory count successfully updated for Unused Parts`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: 0,
      message: `Error: ${error.message}`,
    });
  }
});

// NEW ROUTE for updating the inventory count
router.post("/updateInventoryCountNew", isAuthenticated, async (req, res) => {
  try {
    const { TicketID, spareParts } = req.body;
    const serviceTicket = await Service_Request.findById(TicketID);
    res.send(serviceTicket);
  } catch (e) {
    console.log("e", e);
  }
  // const {parts} = req.body.data
  // for(let part of parts){
  //   const res= await InventoryCount.findOne({})
  // }
});

router.post("/stockoutinventory", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    const role = req.user.role;

    if (role !== "Inventory Manager" && role !== "Manager") {
      return res.status(401).send("Not Authorized to perform this Operation");
    }

    await StockOutOperation(req, res);
  } catch (error) {
    res
      .status(500)
      .json({ code: 0, message: "Something went wrong!Please try again" });
  }
});

//Inventory View
router.post("/hubexchangeinventory", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    const role = req.user.role;

    if (role !== "Inventory Manager" && role !== "Manager") {
      return res.status(401).send("Not Authorized to perform this Operation");
    }

    await hubExchangeOperation(req, res);
  } catch (error) {
    res
      .status(500)
      .json({ code: 0, message: "Something went wrong!Please try again" });
  }
});

router.post("/getinventorydetails", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    const location = req.user.location;
    const role = req.user.role;
    const hubIds = req.user.hub_id;

    console.log(location, role, hubIds);

    if (role !== "Inventory Manager" && role !== "Manager") {
      return res.status(401).send("Not Authorized to perform this Operation");
    }

    let query = {};

    // Apply filtering based on role
    if (role === "Inventory Manager" && hubIds && hubIds.length > 0) {
      query.hub_id = { $in: hubIds };
    } else if (role === "Manager") {
      query.location = location;
    }

    let Data = await InventoryDetails.find(query).lean();

    console.log(Data);

    Data.forEach((item) => {
      item.parts.forEach((part) => {
        part.part_name = part.product_name;
        delete part.product_name;
      });
    });

    console.log(Data, "after deletion");

    // Sort Data from new to old according to Date
    let sortedData = Data.sort((a, b) => b.date - a.date);
    res.status(200).send(sortedData);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/gettechniciandetails", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    const location = req.user.location;
    const role = req.user.role;
    const hubIds = req.user.hub_id;
    const consumerTechnician = req.body.consumer_technician;

    console.log(location, role, hubIds, consumerTechnician);

    if (
      role !== "Inventory Manager" &&
      role !== "Manager" &&
      !consumerTechnician
    ) {
      return res.status(401).send("Not Authorized to perform this Operation");
    }

    let query = {};

    if (consumerTechnician) {
      query.consumer_technician = consumerTechnician;

      let Data = await InventoryDetails.find(query).lean();

      if (!Data.length) {
        return res
          .status(404)
          .send(
            `No inventory details found for consumer_technician: ${consumerTechnician}`
          );
      }

      Data.forEach((item) => {
        item.parts.forEach((part) => {
          part.part_name = part.product_name;
          delete part.product_name;
        });
      });

      console.log(Data, "after deletion");

      let sortedData = Data.sort((a, b) => b.date - a.date);
      return res.status(200).send(sortedData);
    }

    if (role === "Inventory Manager" && hubIds && hubIds.length > 0) {
      query.hub_id = { $in: hubIds };
    } else if (role === "Manager") {
      query.location = location;
    }

    let Data = await InventoryDetails.find(query).lean();

    Data.forEach((item) => {
      item.parts.forEach((part) => {
        part.part_name = part.product_name;
        delete part.product_name;
      });
    });

    console.log(Data, "after deletion");

    let sortedData = Data.sort((a, b) => b.date - a.date);
    res.status(200).send(sortedData);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/getcurrentinventory", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    const role = req.user.role;

    if (role !== "Inventory Manager" && role !== "Manager") {
      return res.status(401).send("Not Authorized to perform this Operation");
    }

    let location = req.user.location;
    // console.log(location);
    let Data = await InventoryCount.find({ location });

    res.status(200).send(Data);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post(
  "/gettechnicianinventoryhistory",
  isAuthenticated,
  async (req, res) => {
    logroute(req);
    try {
      const role = req.user.role;

      if (role !== "Inventory Manager" && role !== "Manager") {
        return res.status(401).send("Not Authorized to perform this Operation");
      }

      let technician = req.body.data.technician;
      let location = req.user.location;

      console.log(technician, location);
      let Data = await InventoryDetails.find({
        consumer_technician: technician,
        location,
      });

      res.status(200).send(Data);
    } catch (error) {
      res.status(500).send(`Error: ${error}`);
    }
  }
);

router.post("/openservicerequest", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    let role = req.user.role;
    if (role === "Manager") {
      await getOpenServiceRequest(req, res);
    } else if (role === "Technician") {
      await getTechnicianOpenServiceRequest(req, res);
    } else if (role === "Employee") {
      await getOpenServiceRequest(req, res);
    } else if (role === "Owner") {
      await getOwnerOngoingServiceRequest(req, res);
    } else if (role === "Rider") {
      await getRiderOngoingServiceRequest(req, res);
    } else {
      res.status(500).send("Something went wrong!");
    }
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/closedservicerequest", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    let role = req.user.role;
    if (role === "Manager") {
      await getClosedServiceRequest(req, res);
    } else if (role === "Technician") {
      await getTechnicianCompleteServiceRequest(req, res);
    } else if (role === "Employee") {
      await getClosedServiceRequest(req, res);
    } else if (role === "Owner") {
      await getOwnerCompleteServiceRequest(req, res);
    } else if (role === "Rider") {
      await getRiderCompleteServiceRequest(req, res);
    } else {
      res.status(500).send("Something went wrong!");
    }
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/allservicerequest", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    let role = req.user.role;
    if (role === "Technician") {
      await getTechnicianAllServiceRequest(req, res);
    } else if (role === "Manager" || role === "Admin") {
      await getAllServiceRequest(req, res);
    } else if(role === "MIS"){
      await getAllMISServiceRequest(req, res);
    } else if (role === "Employee") {
      await getAllServiceRequest(req, res);
    } else if (role === "Rider") {
      await getRiderAllServiceRequest(req, res);
    } else if (role === "Owner") {
      await getOwnerAllServiceRequest(req, res);
    }
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/gettechnicianforlocation", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    await TechnicianForLoc(req, res);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/getvehicleid", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    let role = req.user.role;
    if (role === "Manager" || role === "Admin") {
      await getAllVehId(req, res);
    } else if (role === "Technician") {
      await getAllVehId(req, res);
    } else if (role === "Owner") {
      await getVehIdforOwner(req, res);
    } else if (role === "Employee") {
      await getAllVehId(req, res);
    } else if (role === "Rider") {
      await getVehIdforRider(req, res);
    } else {
      res.status(500).send("Something went wrong!");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(`Error: ${error}`);
  }
});

//location wise service requests
router.post("/getlocationwisesr", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    await getLocationwiseSRs(req, res);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/getrequeststats", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    await getRequestsStats(req, res);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/servicerequest/:ticket_id", async (req, res) => {
  logroute(req);
  try {
    const requestedTitle = req.params.ticket_id;
    console.log(requestedTitle);

    let data = await Service_Request.find({ ticket_id: requestedTitle });

    if (data.length === 0) {
      res.status(404).send({ message: "Details not Found" });
      return;
    }
    let latestStatus = "";
    if (data[0]["status"].done.check) {
      latestStatus = "Done";
    } else if (
      data[0]["status"].to_do.check &&
      data[0]["status"].in_progress.check
    ) {
      latestStatus = "In Progress";
    } else {
      latestStatus = "To Do";
    }
    const updatedData = [{ ...data[0]._doc, latestStatus }];
    res.status(200).send(updatedData);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const {
  ServiceApprovalRequest,
} = require("../model/serviceRequestsApproval.js");
const {
  storeRequests,
  getAllRequests,
  handleRequests,
} = require("../controllers/requestApproval.controller.js");

dotenv.config();

const pool = mysql.createPool({
  connectionLimit: process.env.MYSQL_CONNECTION_LIMIT,
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_ASSET_DATABASE, // Use the asset database as default
});
const CITY_ID = {
  1: "NCR",
  2: "NCR",
  4: "NCR",
  6: "Hyderabad",
  // 7: 'Bokaro',
  8: "Ghaziabad",
  // 10: 'Mumbai',
  11: "NCR",
  12: "Kolkata",
  13: "Bengaluru",
  14: "CHANDIGARH",
};

router.post("/getdetailsbyvehicleid", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    const { vehicle_no } = req.body.data;
    let location = "";
    console.log({
      connectionLimit: process.env.MYSQL_CONNECTION_LIMIT,
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_ASSET_DATABASE, // Use the asset database as default
    });

    // Query asset database
    await pool.query(`USE ${process.env.MYSQL_ASSET_DATABASE}`);
    const [assetRows] = await pool.query(
      `SELECT ad.asset_id, ad.asset_code, ad.asset_type_id, ad.city_id, ad.state_id, ms.city_name, ms.city_code  FROM asset_details ad 
      LEFT JOIN masters.ms_city ms ON ms.city_id = ad.city_id 
      WHERE asset_code = ?`,
      [vehicle_no]
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
    const assetId = assetRows[0].asset_id;
    
    // Switch to subscriber database
    await pool.query(`USE ${process.env.MYSQL_SUBSCRIBER_DATABASE}`);
    
    // Fetch all rows for the asset, ordering by active status
    const [allAssetRows] = await pool.query(
      "SELECT active, subscriber_id FROM subscriber_assets WHERE asset_id = ? ORDER BY active DESC",
      [assetId]
    );

    if (allAssetRows.length === 0) {
      res.status(200).send([
        {
          name: "",
          mob_number: "",
          email: "",
          location,
          vehicle_no: vehicle_no,
        },
      ]);
      return;
    }

    // Find the first active record if it exists
    const activeRecord = allAssetRows.find(row => 
      Buffer.isBuffer(row.active) ? row.active[0] === 1 : row.active === 1
    );

    if (!activeRecord) {
      // No active records found
      res.status(200).send([
        {
          name: "",
          mob_number: "",
          email: "",
          location,
          vehicle_no: vehicle_no,
        },
      ]);
      return;
    }

    const subscriberId = activeRecord.subscriber_id;
    console.log("Selected Active Record:", activeRecord);
    console.log("Selected Subscriber ID:", subscriberId);
    
    // Fetch subscriber details
    const [subscriberRows] = await pool.query(
      "SELECT subscriber_full_name, subscriber_email, city_id, subscriber_mobile FROM subscriber_details WHERE subscriber_id = ?",
      [subscriberId]
    );
    
    if (subscriberRows.length === 0) {
      console.log(
        "No subscriber details found for subscriber_id:",
        subscriberId
      );
      res.status(200).send([
        {
          name: "",
          mob_number: "",
          email: "",
          location,
          vehicle_no: vehicle_no,
        },
      ]);
      return;
    }
    
    const subscriberDetails = subscriberRows[0];
    console.log("Subscriber Details:", subscriberDetails);
    
    const response = [
      {
        name: subscriberDetails.subscriber_full_name || "",
        mob_number: subscriberDetails.subscriber_mobile || "",
        email: subscriberDetails.subscriber_email || "",
        location,
        vehicle_no: vehicle_no,
      },
    ];
    
    res.status(200).send(response);
  } catch (error) {
    console.error(error);
    res.status(500).send([{ message: "Internal server error" }]);
  } finally {
    await pool.query(`USE ${process.env.MYSQL_ASSET_DATABASE}`);
  }
});

router.post("/gettechniciansrecords", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    let result = [];
    let location = req.body.location || req.user.location;

    const technicians = await User.find(
      { role: "Technician", ...(location ? { location } : {}) },
      { _id: 1, name: 1 }
    );

    const techniciansList = technicians.map((doc) => ({
      id: doc._id,
      name: doc.name,
    }));

    console.log(technicians);

    // Loop through each technician
    for (const technician of techniciansList) {
      const technicianId = technician.id;

      const incompleteServiceRequests = await Service_Request.find({
        "assigned_to.technician": technician.name,
        "status.done.check": false,
      });

      const completeServiceRequests = await Service_Request.find({
        "assigned_to.technician": technician.name,
        "status.done.check": true,
      });

      result.push({
        key: technicianId,
        name: technician.name,
        incomplete: incompleteServiceRequests.length,
        complete: completeServiceRequests.length,
      });
    }

    res.status(200).send(result);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/editManager", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    let ticketId = req.body.data.ticket_id;
    // let technician = req.body.data.assigned_technician;
    let technicianId = req.body.data.technician_id.key;

    let obj = await checkTechnicianAlreadyAssigned(ticketId, technicianId);
    console.log(obj);
    if (obj.code === 0) {
      let resObj = await assignTechnician(ticketId, technicianId);
      console.log(obj);

      if (resObj.code === 1) {
        res.status(200).send(resObj);
      } else {
        res.status(resObj.code).send(resObj.message);
      }
    } else {
      res.status(obj.code).send(obj.message);
    }
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/updatetechnician", async (req, res) => {
  logroute(req);
  try {
    let ticketId = req.body.data.ticket_id;
    // let technician = "";
    let technicianId = req.body.data.technician_id?.key;

    let dateTime;
    if (req.body.data.date_time) {
      const tempTime =
        new Date(req.body.data.date_time).getTime() + 5.5 * 60 * 60 * 1000;
      dateTime = new Date(tempTime);
    } else {
      const currentTime = new Date().getTime() + 5.5 * 60 * 60 * 1000;
      dateTime = new Date(currentTime);
    }

    let data = await Service_Request.findOne({ ticket_id: ticketId });

    if (!data) {
      return res.status(404).json({ code: 0, message: "Ticket ID not found" });
    }

    let technicianData = await User.findOne({
      role: "Technician",
      _id: technicianId,
    });

    if (!technicianData) {
      return res.status(404).json({ code: 0, message: "Technician not found" });
    }

    //technician add
    //data save
    // if (technicianData) {
    //   let technicianMail = technicianData.email;
    //   console.log("techMail", technicianMail);

    //   const message = `Manager reassigned you a service request, please have a view. Service Request Details: Service_Request ID: ${ticketId}

    //   Asset Details:

    //   Asset: ${data.vehicle},
    //   Customer Name: ${data.customer_name}
    //   Customer Mobile: ${data.customer_mobile}
    //   Odometer Reading: ${data.odometer_reading},
    //   Request_Type: ${data.request_type}
    //   Description: ${data.issue_description}`;

    //   try {
    //     await sendEmail({
    //       email: technicianMail,
    //       subject: `Reassigned Service Request ${ticketId}`,
    //       message,
    //     });
    //   } catch (error) {
    //     console.log(error);
    //     let resObj = `Unable to send email to ${technician}`;
    //     console.log(error);
    //     return resObj;
    //   }
    // }

    data.assigned_to.technician = technicianData.name;
    data.assigned_to.id = technicianData._id;
    data.assigned_to.check = true;
    data.assigned_to.date_time = dateTime;
    data.status.to_do.date_time = dateTime;

    await data.save();

    res.status(200).json({
      code: 1,
      message: `Technician ${technicianData.name} reassigned to service request ${ticketId}`,
      details: data,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ code: 0, message: `Error: ${error.message}` });
  }
});

router.post("/unapprovedparts", isAuthenticated, async (req, res) => {
  try {
    let location = req.user.location;

    let unapprovedParts = await Service_Request.find({
      "status.done.check": false,
      location: location,
    }).sort({ createdAt: -1 });

    // Filter for requested_parts where Approved = false, Rejected = false, and count > 0
    let filteredParts = unapprovedParts.filter((item) => {
      return item.requested_parts.some(
        (part) =>
          part.Approved === false && part.Rejected === false && part.count > 0
      );
    });

    let extractedData = filteredParts.map((item) => {
      return {
        ticket_id: item.ticket_id,
        vehicle: item.vehicle,
        location: item.location,
        technician: item.assigned_to.technician,
        requested_parts: item.requested_parts
          .filter(
            (part) =>
              part.Approved === false &&
              part.Rejected === false &&
              part.count > 0
          )
          .map((part) => ({
            make: part.make,
            product_name: part.product_name,
            count: part.count,
            old_part_image: part.part_image?.old_part_image?.image || null,
          })),
      };
    });

    res.status(200).send(extractedData);
  } catch (error) {
    console.error("Error in /unapprovedparts route:", error);
    res.status(500).send(`Error: ${error}`);
  }
});

//Route to update approved and rejected status
router.post("/approvedrejectedparts", isAuthenticated, async (req, res) => {
  try {
    const { ticket_id, Approved, Rejected } = req.body;

    if (!ticket_id || (Approved === undefined && Rejected === undefined)) {
      return res
        .status(400)
        .send(
          "Invalid input: ticket_id is required and one of Approved or Rejected must be specified."
        );
    }

    const updateFields = {};
    if (Approved === 1) {
      updateFields["requested_parts.$[part].Approved"] = true;
    } else if (Rejected === 1) {
      updateFields["requested_parts.$[part].Rejected"] = true;
    }

    const result = await Service_Request.updateOne(
      { ticket_id: ticket_id },
      {
        $set: updateFields,
      },
      {
        arrayFilters: [
          {
            $or: [
              { "part.Approved": { $exists: false } },
              { "part.Rejected": { $exists: false } },
              { "part.Approved": false, "part.Rejected": false },
            ],
          },
        ],
      }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .send(
          "No parts updated: Ticket ID not found or parts already approved/rejected."
        );
    }

    res.status(200).send("Part status updated successfully.");
  } catch (error) {
    console.error("Error in /approvedrejectedparts route:", error);
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/editTechnician", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    let ticketId = req.body.data.ticket_id;
    let requestedParts = req.body.data.requested_parts;
    let imageUrls = req.body.data.old_part_image;
    let technician = req.user.name;
    let location = req.user.location;

    console.log("Image URLs:", imageUrls);

    let resObj = await requestParts(
      ticketId,
      requestedParts,
      technician,
      location,
      imageUrls
    );

    if (resObj.code === 1) {
      res.status(200).send(resObj);
    } else {
      res.status(resObj.code).send(resObj.message);
    }
  } catch (error) {
    console.error("Error in /editTechnician route:", error);
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/getnumberforrequest", isAuthenticated, async (req, res) => {
  try {
    let ticketId = req.body.ticket_id;

    console.log(ticketId);

    if (ticketId === undefined) {
      res.status(404).json({ message: "Please provide Ticket ID" });
      return;
    }

    let data = await Service_Request.findOne({ ticket_id: ticketId });

    if (!data) {
      res.status(404).json({ message: "Ticket ID not found in details" });
      return;
    }

    if (data.status.to_do.check && data.status.in_progress.check) {
      let phoneNo;
      if (data.created_by && data.request_type === "At Hub") {
        let created_by = data.created_by;
        // console.log(created_by);

        let createdUserDetails = await User.findOne({ _id: created_by });
        // console.log(createdUserDetails);
        if (createdUserDetails.role == "Admin") {
          let managerDetails = await User.findOne({
            role: "Manager",
            location: data.location,
          });
          phoneNo = managerDetails.mob_number;
        } else {
          let createdUserNumber = createdUserDetails.mob_number;
          phoneNo = createdUserNumber;
        }
      } else {
        phoneNo = data.customer_mobile;
      }

      console.log(phoneNo);

      res.status(200).json({ code: 1, phoneNo });
    } else if (data.status.to_do.check && !data.status.in_progress.check) {
      return res.status(400).json({
        code: 0,
        message:
          "Service Request is currently in To Do status, please make it in 'In Progress' first!",
      });
    } else {
      return res.status(400).json({
        code: 0,
        message: "Please make your status to 'In Progress' and try again!",
      });
    }
  } catch (error) {
    res.status(500).send(`Internal Server Error : ${error}`);
  }
});

//
router.post("/techniciandone", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    console.log(req.user);
    console.log(req.body);
    let ticketId = req.body.data.ticket_id;
    let location = req.user.location;

    let data = await Service_Request.findOne({ ticket_id: ticketId });

    if (data.length === 0) {
      res.status(404).json({ message: "Ticket ID not found" });
      return;
    }

    let today = new Date();
    let ISTDate = new Date(today.getTime() + 5.5 * 60 * 60 * 1000);

    let done = {
      check: true,
      date_time: ISTDate,
    };
    // console.log(to_do);

    //mail Manager
    try {
      const managerDetails = await User.findOne(
        {
          location,
          role: "Manager",
        },
        {
          email: 1,
        }
      );

      if (!managerDetails) {
        console.log("Could Not Find Manager");
        return 0;
      }
      console.log("m", managerDetails);

      let managerEmail = managerDetails.email;
      const message = `Dear Branch Manager, Service Request ${ticketId} has been completed. Service Request Details:

      Asset: ${data.vehicle},
      Customer Name: ${data.customer_name}
      Customer Mobile: ${data.customer_mobile}
      Odometer Reading: ${data.odometer_reading},
      Request_Type: ${data.request_type}
      Description: ${data.issue_description}`;

      await sendEmail({
        email: managerEmail,
        subject: `Service Request Completed! VehicleID: ${data.vehicle}`,
        message,
      });
    } catch (error) {
      res.status(500).send("Could not send email to Manager");
      console.log(error);
      return;
    }

    data.status.done = done;
    data.closure_date = ISTDate;
    await data.save();

    // Change Vehicle Status in hubapp_master_data Collection.
    await change_Vehicle_Status_To_RFD(ticketId);

    res.status(200).json({
      message: `Service Requests Completed Successfully! Mail Sent to Manager`,
    });
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

//admin view
router.post("/getriderdata", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    let Data = await Rider.find(
      {},
      {
        _id: 1,
        name: 1,
        vehicle_no: 1,
        owner: 1,
        location: 1,
        mob_number: 1,
        status: 1,
      }
    ).lean();

    Data = await Promise.all(
      Data.map(async (ele) => {
        if (ele.role === "Owner") {
          let owner_mob = ele.mob_number;
          let riderData = await Rider.find({ owner_mob }).lean();
          let riderDataLength = riderData.length;
          ele.linked_riders = riderDataLength;
        }
        return ele;
      })
    );

    res.status(200).send(Data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/getdetailsofrider", async (req, res) => {
  logroute(req);
  try {
    const vehicle_no = req.body.data.vehicle_no;

    let Data = await Rider.find(
      { vehicle_no },
      {
        _id: 1,
        name: 1,
        vehicle_no: 1,
        owner: 1,
        owner_email: 1,
        location: 1,
        mob_number: 1,
        email: 1,
        status: 1,
      }
    ).lean();

    res.status(200).send(Data);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/updaterider", async (req, res) => {
  logroute(req);
  try {
    const { _id } = req.body.data;
    // const update = { $set: {} };

    const rider = await Rider.findById(_id);
    // console.log(rider);

    if (!rider) {
      return res.status(404).send("Rider not found");
    }

    Object.entries(req.body.data).forEach(([key, value]) => {
      if (key !== "_id" && key != "vehicle_no" && value !== "") {
        // update.$set[key] = value;
        rider[key] = value;
      }
    });

    // const updatedRider = await Rider.updateOne({ _id }, update, { new: true });
    await rider.save();
    // console.log(rider);

    const updatedRiderResponse = {
      name: rider.name,
      mob_number: rider.mob_number,
      email: rider.email,
      location: rider.location,
      status: rider.status,
      role: rider.role,
      owner: rider.owner,
      owner_email: rider.owner_email,
      owner_mob: rider.owner_mob,
    };

    res.status(200).json({
      code: 1,
      message: "Rider updated successfully",
      data: updatedRiderResponse,
    });
  } catch (error) {
    res.status(500).json({ code: 0, message: `Error: ${error}` });
    console.log(error);
  }
});

router.delete("/deleterider/:vehicle_no", async (req, res) => {
  logroute(req);
  try {
    const vehicle_no = req.params.vehicle_no;

    const rider = await Rider.findOne({ vehicle_no });

    // If no user is found, return a 404 status code with an error message
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    // Delete the user from the database
    await rider.remove();

    // let Data = await Rider.deleteOne(
    //   {vehicle_no}
    // )

    // if (Data.deletedCount === 0){
    //   res.status(400).send("Error! Rider Not deleted");
    //   return
    // }

    res.status(200).send("Rider deleted successfully");
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/getuserdata", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    let Data = await User.find(
      {},
      {
        _id: 0,
        name: 1,
        role: 1,
        location: 1,
        mob_number: 1,
        status: 1,
      }
    ).lean();

    Data = await Promise.all(
      Data.map(async (ele) => {
        if (ele.role === "Owner") {
          let owner_mob = ele.mob_number;
          let riderData = await Rider.find({ owner_mob }).lean();
          let riderDataLength = riderData.length;
          ele.linked_riders = riderDataLength;
        }
        return ele;
      })
    );

    res.status(200).send(Data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/getdetailsofuser", async (req, res) => {
  logroute(req);
  try {
    const mob_number = req.body.data.mob_number;

    let Data = await User.find(
      { mob_number },
      {
        _id: 1,
        name: 1,
        location: 1,
        mob_number: 1,
        email: 1,
        status: 1,
        role: 1,
      }
    ).lean();

    res.status(200).send(Data);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/updateuser", async (req, res) => {
  logroute(req);
  try {
    const { _id } = req.body.data;
    const update = { $set: {} };

    const user = await User.findOne({ _id });
    console.log(user);

    if (!user) {
      return res.status(404).send("User not found");
    }

    Object.entries(req.body.data).forEach(([key, value]) => {
      if (key !== "_id" && value !== "") {
        update.$set[key] = value;
      }
    });
    console.log(update, user.role);
    if (user.role === "Owner") {
      ({ mob_number, email, name } = update.$set);
      console.log(mob_number, email, name);

      let update1 = { $set: {} };

      if (mob_number) {
        update1.$set["owner_mob"] = mob_number;
      }

      if (email) {
        update1.$set["owner_email"] = email;
      }

      if (name) {
        update1.$set["owner"] = name;
      }

      console.log(update1);

      const updateRider = await Rider.updateMany(
        { owner_mob: user.mob_number },
        update1
      );
      console.log(updateRider);
    }

    const updatedUser = await User.updateOne({ _id }, update);

    res.status(200).send("User updated successfully");
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
    console.log(error);
  }
});

router.delete("/deleteuser/:mob_number", async (req, res) => {
  logroute(req);
  try {
    const mob_number = req.params.mob_number;

    const user = await User.findOne({ mob_number });

    if (!user) {
      return res.status(404).send("User not found");
    }

    if (user.role === "Owner") {
      let riderData = await Rider.deleteMany({ owner_mob: mob_number });
    }

    await user.remove();

    res.status(200).send("User deleted successfully");
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

//add users route
router.post("/adduser", async (req, res) => {
  logroute(req);
  try {
    customer_name = req.body.data.name;
    customer_mobile = req.body.data.mob_number;
    customer_email = req.body.data.email;

    console.log(customer_name, customer_mobile, customer_email);
    const validationErrors = await validateServiceRequestData({
      customer_name,
      customer_mobile,
      customer_email,
    });
    console.log("hello");
    if (validationErrors.length > 0) {
      res.status(400).json({ code: 0, message: validationErrors[0] });
      return;
    }
    const record = new User(req.body.data);
    let data = record
      .save()
      .then(() => {
        res.status(200).json({ code: 1, message: "New User Added!" });
      })
      .catch((error) => {
        if (error.code === 11000 && error.keyPattern?.mob_number) {
          //
          res.status(400).json({
            code: 0,
            message: `Mobile number ${req.body.data.mob_number} is already in use.`,
          });
        } else {
          console.error(error);
          res
            .status(500)
            .json({ code: 0, message: "An error occurred. Please try again." });
        }
      });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ code: 0, message: "Internal Server Error : Unable to Add User" });
  }
});

//delete users route
router.post("/deleteuser", async (req, res) => {
  logroute(req);
  try {
    const { key, data } = req.body;
    const { name, mob_number, email } = data;

    const validationErrors = await validateServiceRequestData({
      customer_name: name,
      customer_mobile: mob_number,
      customer_email: email,
    });

    if (validationErrors.length > 0) {
      res.status(400).json({ code: 0, message: validationErrors[0] });
      return;
    }

    const user = await User.findOne({
      name: name,
      mob_number: mob_number,
      email: email,
    });

    if (!user) {
      return res.status(404).json({
        code: 0,
        message: "User not found with provided details",
      });
    }

    if (user.role !== "Technician") {
      return res.status(403).json({
        code: 0,
        message: "Only users with Technician role can be deleted",
      });
    }

    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      code: 1,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: 0,
      message: "Internal Server Error : Unable to delete user",
    });
  }
});

// update technician route
router.post("/updatetechniciancreds", async (req, res) => {
  logroute(req);
  try {
    const { key, data } = req.body;
    const {
      current_mob_number,
      current_email,
      new_name,
      new_mob_number,
      new_email,
      location,
    } = data;

    const existingUser = await User.findOne({
      mob_number: current_mob_number,
      email: current_email,
    });

    if (!existingUser) {
      return res.status(404).json({
        code: 0,
        message: "User not found with provided mobile number and email",
      });
    }

    if (existingUser.role !== "Technician") {
      return res.status(403).json({
        code: 0,
        message: "Only Technician users can be updated",
      });
    }

    let updateData = {};

    if (new_name) {
      const nameValidation = await validateServiceRequestData({
        customer_name: new_name,
      });
      if (nameValidation.some((error) => error.includes("name"))) {
        return res.status(400).json({ code: 0, message: nameValidation[0] });
      }
      updateData.name = new_name;
    }

    if (location) {
      const nameValidation = await validateServiceRequestData({
        location: location,
      });
      if (nameValidation.some((error) => error.includes("location"))) {
        return res.status(400).json({ code: 0, message: nameValidation[0] });
      }
      updateData.location = location;
    }

    if (new_mob_number) {
      const mobileValidation = await validateServiceRequestData({
        customer_mobile: new_mob_number,
      });
      if (mobileValidation.some((error) => error.includes("mobile"))) {
        return res.status(400).json({ code: 0, message: mobileValidation[0] });
      }

      const mobileExists = await User.findOne({
        mob_number: new_mob_number,
        _id: { $ne: existingUser._id },
      });
      if (mobileExists) {
        return res.status(400).json({
          code: 0,
          message: "Mobile number already registered with another user",
        });
      }
      updateData.mob_number = new_mob_number;
    }

    if (new_email) {
      const emailValidation = await validateServiceRequestData({
        customer_email: new_email,
      });
      if (emailValidation.some((error) => error.includes("email"))) {
        return res.status(400).json({ code: 0, message: emailValidation[0] });
      }

      const emailExists = await User.findOne({
        email: new_email,
        _id: { $ne: existingUser._id },
      });
      if (emailExists) {
        return res.status(400).json({
          code: 0,
          message: "Email already registered with another user",
        });
      }
      updateData.email = new_email;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        code: 0,
        message: "No update data provided",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      existingUser._id,
      updateData,
      { new: true }
    );

    res.status(200).json({
      code: 1,
      message: "User updated successfully",
      data: {
        name: updatedUser.name,
        mob_number: updatedUser.mob_number,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      code: 0,
      message: "Internal Server Error : Unable to update user",
    });
  }
});

//add riders route
router.post("/addrider", async (req, res) => {
  logroute(req);
  try {
    let customer_name = req.body.data.name;
    let customer_mobile = req.body.data.mob_number;
    let customer_email = req.body.data.email;

    console.log(customer_name, customer_mobile, customer_email);
    const validationErrors = await validateServiceRequestData({
      customer_name,
      customer_mobile,
      customer_email,
    });
    if (validationErrors.length > 0) {
      return res.status(400).json({ code: 0, message: validationErrors[0] });
    }

    // make the vehicle_no to uppercase
    let { vehicle_no } = req.body.data;
    if (vehicle_no && typeof vehicle_no === "string") {
      req.body.data.vehicle_no = vehicle_no.toUpperCase();
    }

    const record = new Rider(req.body.data);
    let data = record
      .save()
      .then(() => {
        res.status(200).json({ code: 1, message: "New Rider Added!" });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ code: 0, message: err.message });
      });
  } catch (error) {
    res.status(500).json({
      code: 0,
      message: "Internal Server Error : Unable to Add Rider",
    });
  }
});

//login users route
router.post("/userlogin", async (req, res) => {
  logroute(req);
  try {
    const { mob_number, password } = req.body.data;
    if (!mob_number || !password) {
      return res
        .status(400)
        .json({ error: "Please fill all the required fields!" });
    }
    const userdetails = await User.findOne({ mob_number });
    if (userdetails) {
      //comparing hashed password
      const isMatch = await bcrypt.compare(password, userdetails.password);
      if (isMatch) {
        //generating token
        const token = await userdetails.generateAuthToken();
        console.log(
          "Token Details : ",
          jwt.verify(token, process.env.TOKEN_KEY)
        );
        console.log(`Token : ${token}`);
        //storing token in cookie
        res.cookie("servicerequest-token", token, {
          expires: new Date(Date.now() + 14400000), // Expires in 4 Hours
          httpOnly: true,
        });

        res.status(200).json({
          message: "User Logged in Successfully!",
          token: token,
          Details: {
            _id: userdetails._id,
            name: userdetails.name,
            mob_number: userdetails.mob_number,
            email: userdetails.email,
            location: userdetails.location,
            status: userdetails.status,
            role: userdetails.role,
            application_access: userdetails.application_access,
            hub_id: userdetails.hub_id,
          },
        });
        User.findByIdAndUpdate(
          (id = userdetails._id),
          { $set: { last_login: new Date() } },
          { new: true },
          (err, data) => {
            if (err) console.log(err);
          }
        );
      } else {
        res.status(400).json({ error: "Invalid Credentials! ismatch" });
      }
    } else {
      res.status(400).json({ error: "Invalid Credentials! usedetails" });
    }
  } catch (error) {
    console.log(error);
  }
});

//login users route
router.post("/riderlogin", async (req, res) => {
  logroute(req);
  try {
    const { vehicle_no, password } = req.body.data;
    if (!vehicle_no || !password) {
      return res
        .status(400)
        .json({ error: "Please fill all the required fields!" });
    }
    const riderdetails = await Rider.findOne({ vehicle_no });
    if (riderdetails) {
      //comparing hashed password
      const isMatch = await bcrypt.compare(password, riderdetails.password);
      if (isMatch) {
        //generating token
        const token = await riderdetails.generateAuthToken();
        console.log(`Token : ${token}`);
        //storing token in cookie
        res.cookie("servicerequest-token", token, {
          expires: new Date(Date.now() + 25892000000),
          httpOnly: true,
        });
        res.status(200).json({
          message: "User Logged in Successfully!",
          token: token,
          Details: {
            id: riderdetails._id,
            name: riderdetails.name,
            mob_number: riderdetails.mob_number,
            email: riderdetails.email,
            location: riderdetails.location,
            status: riderdetails.status,
            role: riderdetails.role,
            owner: riderdetails.owner,
            owner_email: riderdetails.owner_email,
            owner_mob: riderdetails.owner_mob,
            vehicle_no: riderdetails.vehicle_no,
          },
        });
      } else {
        res.status(400).json({ error: "Invalid Credentials! ismatch" });
      }
    } else {
      res.status(400).json({ error: "Vehicle Not Registered yet" });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/logout", isAuthenticated, async (req, res) => {
  logroute(req);
  // console.log(req);
  try {
    req.user.token = "";

    // Save the updated user in the database
    await req.user.save((err, res) => {
      if (err) {
        console.log(err, "hello");
      }
    });

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/changepassword", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    let user;
    const { oldPassword, newPassword, id, role } = req.body.data;

    if (!oldPassword || !newPassword) {
      return res.status(400).send("Please fill all the required fields!");
    }

    if (role === "User") {
      user = await User.findById(id);
    } else {
      user = await Rider.findById(id);
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).send("Old Password is Incorrect!");
    }

    user.password = newPassword;
    await user.save();

    res.status(200).send("Password changed successfully!");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error: Unable to change password!");
  }
});

router.post("/checkmobilenumber", async (req, res) => {
  logroute(req);
  try {
    const { mob_number, role } = req.body;
    if (!mob_number) {
      return res.status(400).send("Please fill all the required fields!");
    }
    let user;
    if (role === "user") {
      user = await User.findOne({ mob_number });
    } else {
      user = await Rider.findOne({ mob_number });
    }

    console.log(user);
    if (!user) {
      return res.status(401).send("Mobile Number is Not Registered");
    }

    res.status(200).send("Mobile Number is Registered");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error: Unable to change password!");
  }
});

router.post("/resetpassword", async (req, res) => {
  logroute(req);
  try {
    const { mob_number, newPassword, role } = req.body;
    if (!mob_number || !newPassword) {
      return res.status(400).send("Please fill all the required fields!");
    }

    let user;
    if (role === "user") {
      user = await User.findOne({ mob_number });
    } else {
      user = await Rider.findOne({ mob_number });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).send("Password changed successfully!");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error: Unable to change password!");
  }
});

router.post("/userDeatils/:id", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    const { role } = req.body.data;
    const { id } = req.params;
    let user;
    if (role === "Rider") {
      user = await Rider.findById(id);
    } else {
      user = await User.findById(id);
    }
    const data = {
      id: user._id,
      name: user.name,
      mob_number: user.mob_number,
      email: user.email,
      location: user.location,
      status: user.status,
      role: user.role,
      owner: user.owner,
      owner_email: user.owner_email,
      owner_mob: user.owner_mob,
      vehicle_no: user.vehicle_no,
    };
    res.status(200).send(data);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error: Unable to change password!");
  }
});

//Inventory View
router.post("/assignpart", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    let location = req.user.location;
    const role = req.user.role;

    if (role !== "Inventory Manager" && role !== "Manager") {
      return res.status(401).send("Not Authorized to perform this Operation");
    }

    let element = req.body.data;
    let partsPrice = "";
    let partsMongoId = "";
    //find technician
    let srData = await Service_Request.find({ ticket_id: element.ticket_id });
    if (srData.length === 0) {
      return res.status(404).send("Ticket ID not Found");
    }

    // get part's price
    try {
      console.log(element.make, element.product_name);
      const partsData = await Part.findOne({
        make: element.make,
        // product_name: { $regex: `${element.product_name}`, $options: "i" },
        product_name: element.product_name,
      });
      console.log(partsData);
      if (partsData?.price) partsPrice = partsData.price;
      partsMongoId = partsData._id;
      console.log(partsPrice, partsMongoId, "parts data");
    } catch (error) {
      console.log(error);
    }

    let consumer_technician = srData[0].assigned_to.technician;

    let data = await InventoryCount.find(
      {
        make: element.make,
        product_name: element.product_name,
        location: location,
      },
      { _id: 0, make: 1, product_name: 1, count: 1 }
    );
    if (data[0].count >= element.count) {
      console.log("inside if");

      console.log(typeof element, typeof element.count, "type");
      let record = new InventoryDetails({
        operation: "stock_out",
        consumer_technician: consumer_technician,
        ticket_id: element.ticket_id,
        location: location,
        parts: [],
      });

      record.parts.push({
        make: element.make,
        product_name: element.product_name,
        count: element.count,
      });
      await record.save();
      await InventoryCount.updateOne(
        {
          make: element.make,
          product_name: element.product_name,
          location: location,
        },
        { $inc: { count: -element.count } }
      );
      let data1 = await Service_Request.findOne({
        ticket_id: element.ticket_id,
      });
      for (let i = 0; i < data1.requested_parts.length; i++) {
        if (
          data1.requested_parts[i].make === element.make &&
          data1.requested_parts[i].product_name === element.product_name
        ) {
          data1.requested_parts.splice(i, 1);
          break; // exit loop since we found the element to delete
        }
      }

      let idxInSpareParts = await getProductByMakeAndProductName(
        element.make,
        element.product_name,
        data1.spare_parts
      );

      if (idxInSpareParts === -1) {
        data1.spare_parts.push({
          make: element.make,
          product_name: element.product_name,
          count: element.count,
          price: partsPrice ? partsPrice : 0,
        });
      } else {
        // Object already exists, so update the count value
        // console.log(data1.spare_parts[idxInSpareParts]);
        idxInSpareParts.count += element.count;
        idxInSpareParts.price = partsPrice ? partsPrice : 0;
      }
      await data1.save();
      res.status(200).send(data1);
    } else {
      console.log("here");
      let cnt = element.count - data[0].count;
      // console.log(data[0].count, element, element.count, cnt);
      record = new InventoryDetails({
        operation: "stock_out",
        consumer_technician: consumer_technician,
        ticket_id: element.ticket_id,
        location: location,
        parts: [],
      });
      record.parts.push({
        make: element.make,
        product_name: element.product_name,
        count: cnt,
      });
      await record.save();
      await InventoryCount.updateOne(
        {
          make: element.make,
          product_name: element.product_name,
          location: location,
        },
        { $inc: { count: -data[0].count } }
      );
      let data1 = await Service_Request.findOne({
        ticket_id: element.ticket_id,
      });
      data1.requested_parts.forEach(async (part) => {
        // console.log(data.count, data[0].count);
        // console.log(data1.requested_parts, part.make);
        if (
          part.make === element.make &&
          part.product_name === element.product_name
        ) {
          part.count = part.count - data[0].count;
        }
      });

      //will return -1 if not present else returns whole object
      let idxInSpareParts = await getProductByMakeAndProductName(
        element.make,
        element.product_name,
        data1.spare_parts
      );

      // console.log(idxInSpareParts);

      if (idxInSpareParts === -1) {
        data1.spare_parts.push({
          make: element.make,
          product_name: element.product_name,
          count: data[0].count,
          price: partsPrice ? partsPrice : 0,
        });
      } else {
        // Object already exists, so update the count value
        // console.log(data1.spare_parts[idxInSpareParts]);
        idxInSpareParts.count += data[0].count;
        idxInSpareParts.price = partsPrice ? partsPrice : 0;
      }

      console.log(data1, "new data1");
      await data1.save();
      res.status(200).send(data1);
    }
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
    console.log(error);
  }
});

router.post("/gettechnicians", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    let location = req.user.location;
    const role = req.user.role;

    console.log(location, role);

    if (role !== "Inventory Manager" && role !== "Manager") {
      return res.status(401).send("Not Authorized to perform this Operation");
    }

    let data = await User.find(
      { location: location, role: "Technician" },
      {
        _id: 0,
        name: 1,
        mob_number: 1,
        email: 1,
        location: 1,
        status: 1,
      }
    );
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

//redflag
router.post("/redflagparts", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    const location = req.user.location;
    const role = req.user.role;
    const hubIds = req.user.hub_id;

    console.log(
      location,
      role,
      role !== "Inventory Manager",
      role !== "Manager"
    );

    if (role !== "Inventory Manager" && role !== "Manager") {
      return res.status(401).send("Not Authorized to perform this Operation");
    }

    let query = { count: { $lte: 50 } };

    // Apply filtering based on role
    if (role === "Inventory Manager" && hubIds && hubIds.length > 0) {
      query.hub_id = { $in: hubIds };
    } else if (role === "Manager") {
      query.location = location;
    }

    let data = await InventoryCount.find(query);
    console.log(query);

    res.status(200).send(data);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/checkavailibility", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    const role = req.user.role;
    const location = req.user.location;
    const hubIds = req.user.hub_id;
    const { requested_parts } = req.body.data;

    if (role !== "Inventory Manager" && role !== "Manager") {
      return res.status(401).send("Not Authorized to perform this Operation");
    }

    const updatedParts = await Promise.all(
      requested_parts.map(async (element) => {
        let query = {
          make: element.make,
          product_name: element.product_name,
          count: { $gte: element.count },
        };

        // Apply filtering based on role
        if (role === "Inventory Manager" && hubIds && hubIds.length > 0) {
          query.hub_id = { $in: hubIds };
        } else if (role === "Manager") {
          query.location = location;
        }

        let data = await InventoryCount.findOne(query).lean();

        return {
          ...element,
          status: data ? data.count >= element.count : false,
        };
      })
    );

    res.status(200).send(updatedParts);
  } catch (error) {
    console.log(error);
    res.status(500).send(`Error: ${error}`);
  }
});

router.post(
  "/getunalloted_service_requests",
  isAuthenticated,
  async (req, res) => {
    logroute(req);
    try {
      const role = req.user.role;
      const location = req.user.location;
      const hubIds = req.user.hub_id;

      if (role !== "Inventory Manager" && role !== "Manager") {
        return res.status(401).send("Not Authorized to perform this Operation");
      }

      let query = {
        $and: [
          { "status.done.check": false },
          { requested_parts: { $elemMatch: { Approved: true } } },
        ],
      };

      // Apply filtering based on role
      if (role === "Inventory Manager" && hubIds && hubIds.length > 0) {
        query.$and.push({ hub_id: { $in: hubIds } });
      } else if (role === "Manager") {
        query.$and.push({ location });
      }

      let Data = await Service_Request.find(query, {
        _id: 0,
        ticket_id: 1,
        vehicle: 1,
        request_type: 1,
        date: 1,
        assigned_to: 1,
        requested_parts: {
          $filter: {
            input: "$requested_parts",
            as: "part",
            cond: { $eq: ["$$part.Approved", true] },
          },
        },
      });

      res.status(200).send(Data);
    } catch (error) {
      res.status(500).send(`Error: ${error}`);
    }
  }
);

router.post("/getmakepartsstatus", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    const role = req.user.role;
    const location = req.user.location;
    const hubIds = req.user.hub_id;
    const { make } = req.body.data;

    if (role !== "Inventory Manager" && role !== "Manager") {
      return res.status(401).send("Not Authorized to perform this Operation");
    }
    let _make = make.toUpperCase();
    let query = { make: _make };
    console.log(query, "query");
    // Apply filtering based on role
    if (role === "Inventory Manager" && hubIds && hubIds.length > 0) {
      query.hub_id = { $in: hubIds };
    } else if (role === "Manager") {
      query["location"] = location;
    }
    console.log(query, "qrery2");
    let Data = await InventoryCount.find(query);
    res.status(200).send(Data);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

//Add New Spare Part Route
router.post("/addpart", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    const role = req.user.role;
    if (!role) {
      res.status(401).send("Not Authorized to perform this Operation");
      return;
    }
    if (role !== "Inventory Manager" && role !== "Manager") {
      return res.status(401).send("Not Authorized to perform this Operation");
    }

    let partData = await Part.find({
      make: req.body.data.make,
      product_name: req.body.data.product_name,
    });

    console.log(partData);

    if (partData.length > 0) {
      return res.status(409).send("Part Data already exists");
    }

    let record = new Part(req.body.data);
    let data = record
      .save()
      .then(() => {
        res.status(200).send("New Part Added!");
      })
      .catch((err) => {
        res
          .status(500)
          .send(`Database Error : Unable to Add Part -> ${err.message}`);
        console.log(err);
      });
    res.status(200).send("done");
  } catch (error) {
    res
      .status(500)
      .send(`Internal Server Error : Unable to Add Part -> ${error.message}`);
    console.log(error);
  }
});

router.post("/getparts", isAuthenticated, async (req, res) => {
  try {
    const role = req.user.role;
    /*
    if (role !== "Inventory Manager" && role !== "Manager") {
      return res.status(401).send("Not Authorized to perform this Operation");
    } */
    const { vehicle_no } = req.body.data;
    const data = await vehicleDetails.find(
      { "Vehicle Name": vehicle_no },
      { _id: 0, Make: 1 }
    );
    if (data.length === 0) {
      let allPartsData = await Part.find(
        {},
        { _id: 0, product_name: 1, make: 1 }
      ).lean();
      let allPartsWithCount = allPartsData.map((part) => {
        return {
          ...part,
          count: 1,
        };
      });
      return res.status(200).send(allPartsWithCount);
    } else if (!data[0].Make || data[0].Make == "") {
      let allPartsData = await Part.find(
        {},
        { _id: 0, product_name: 1, make: 1 }
      ).lean();
      let allPartsWithCount = allPartsData.map((part) => {
        return {
          ...part,
          count: 1,
        };
      });
      return res.status(200).send(allPartsWithCount);
    }
    console.log(dict[data[0].Make], "Make", data[0].Make);
    const parts = await Part.find(
      {
        $or: [
          { make: { $regex: `${dict[data[0].Make]}`, $options: "i" } },
          { make: "Common" },
        ],
      },
      { _id: 0, product_name: 1, make: 1 }
    ).lean();
    const partsWithCount = parts.map((part) => {
      return {
        ...part,
        count: 1,
      };
    });
    res.status(200).send(partsWithCount);
  } catch (error) {
    console.log(error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

//api to get parts list specific to that make and also common parts
router.post("/getmakeparts", isAuthenticated, async (req, res) => {
  try {
    const role = req.user.role;

    if (role !== "Inventory Manager" && role !== "Manager") {
      return res.status(401).send("Not Authorized to perform this Operation");
    }

    const { make } = req.body.data;
    const parts = await Part.find(
      {
        $or: [{ make: make }, { make: "Common" }],
      },
      { _id: 0, product_name: 1 }
    );
    res.status(200).send(parts);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

//api to get list of parts only by its make
router.post("/getpartsbymake", isAuthenticated, async (req, res) => {
  try {
    const role = req.user.role;

    /*
    if (role !== "Inventory Manager" && role !== "Manager") {
      return res.status(401).send("Not Authorized to perform this Operation");
    } */

    const { make } = req.body.data;
    const parts = await Part.find(
      {
        make,
      },
      { _id: 0, product_name: 1 }
    );

    let partsList = [];
    parts.map(async (ele) => {
      partsList.push(ele.product_name);
    });

    res.status(200).send(partsList);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

//api to get common parts
router.post("/getcommonparts", isAuthenticated, async (req, res) => {
  try {
    const role = req.user.role;

    if (role !== "Inventory Manager" && role !== "Manager") {
      return res.status(401).send("Not Authorized to perform this Operation");
    }

    const { make } = req.body.data;
    const parts = await Part.find(
      {
        make: "Common",
      },
      { _id: 0, product_name: 1 }
    );
    res.status(200).send(parts);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/getmakelist", isAuthenticated, (req, res) => {
  logroute(req);
  try {
    data = [
      "Amo",
      "Cosbike",
      "PureEV",
      "Gemopai",
      "Hero NYX",
      "Kinetic",
      "Lectrix",
      "JMT",
      "SHEEMA",
      "Sun Mobility",
      "Common",
      "Test",
    ];
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

router.post("/getmodelList", isAuthenticated, async (req, res) => {
  // [Amo,Cosbike,PureEV,Gemopai,Hero NYX,Kinetic,Lectrix,JMT,SHEEMA,Common]
  // [AMO,COSBIKE,PUREEV,GEMOPAI,HERO,KINETIC,LECTRIX,JMT,SHEEMA,]
  logroute(req);
  const { role } = req.user;
  let { make } = req.body;
  make = make.toUpperCase();
  console.log("role", role);
  console.log("make", make);
  if (role !== "Manager" && role !== "Inventory Manager") {
    return res.status(401).send("Not Authorized to perform this Operation");
  }

  let data;

  // if (make == "Common") {
  //   data = await vehicleDetails.distinct("Model");
  // } else {
  //   data = await vehicleDetails.find({ Make: make }).distinct("Model");
  // }

  if (make == "HERO NYX") {
    data = await vehicleDetails.find({ Make: "HERO" }).distinct("Model");
  } else {
    data = await vehicleDetails.find({ Make: make }).distinct("Model");
  }

  res.status(200).send(data);
});

// Define storage for multer
const storage = multer.memoryStorage();
// Create multer instance
const upload = multer({ storage: storage, array: true });

router.post(
  "/gets3uploadurl",
  upload.array("images"),
  isAuthenticated,
  async (req, res) => {
    logroute(req);
    try {
      console.log(req.body);
      await uploadImagesToS3(req, res);
    } catch (error) {
      console.log(error);
      res.status(500).send(`Error: ${error}`);
    }
  }
);

router.post("/searchservicerequest", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    console.log(req.user.role);
    await searchByVehicleid(req, res);
  } catch (error) {
    console.log(error);
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/getservicerecords", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    // console.log(req.body);
    if (req.user.role === "Rider") {
      await getRiderServiceRecords(req, res);
    } else if (req.user.role === "Owner") {
      await getOwnerServiceRecords(req, res);
    } else if (req.user.role === "Technician") {
      await getTechnicianServiceRecords(req, res);
    } else if (req.user.role === "Employee") {
      await getEmployeeServiceRecords(req, res);
    } else {
      await getServiceRecords(req, res);
    }
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/searchvehicleid", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    let role = req.user.role;
    let { vehicleStr } = req.body.data;
    let searchResult;
    //using it when grouping the serachResult into array of 3, as owner and else vehicle id key is different
    let groupKey = "";

    if (role === "Owner") {
      let owner_mob_number = req.user.mob_number;

      searchResult = await Rider.find(
        {
          owner_mob: owner_mob_number,
          vehicle_no: new RegExp(`^${vehicleStr}`, "i"),
        },
        { _id: 0, vehicle_no: 1 }
      );

      groupKey = "vehicle_no";
    } else {
      searchResult = await vehicleDetails.find(
        {
          "Vehicle Name": new RegExp(`^${vehicleStr}`, "i"),
        },
        { _id: 0, "Vehicle Name": 1 }
      );

      groupKey = "Vehicle Name";
    }
    const groupedVehicles = [];
    let row = [];

    //as in owner the key for vehicle id will be "vehicle_no" and for others it will be "Vehicle Name" so definig groupKey for smooth run of these loop
    searchResult.forEach((vehicle, index) => {
      console.log(vehicle);
      row.push(vehicle[groupKey]);
      if ((index + 1) % 3 === 0 || index === searchResult.length - 1) {
        groupedVehicles.push(row);
        row = [];
      }
    });
    return res.status(200).send(groupedVehicles);
  } catch (error) {
    console.log(error);
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/gettechnicianhistory", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    let { technician } = req.body.data;
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

    console.log(today, last90Days);

    let technicianData = await Service_Request.find({
      "assigned_to.technician": technician,
      date: { $lte: today, $gt: last90Days },
    });

    // console.log(technicianData);
    const serviceStats = {
      "To Do": 0,
      "In Progress": 0,
      Done: 0,
    };

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
        ++serviceStats["Done"];
      } else if (ele["status"].to_do.check && ele["status"].in_progress.check) {
        status = "In Progress";
        ++serviceStats["In Progress"];
      } else {
        status = "To Do";
        ++serviceStats["To Do"];
      }

      result.push({
        ticketId,
        vehicleID,
        customerName,
        type,
        date,
        status,
        technician,
      });
    });

    const sortedResult = result.sort((a, b) => {
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
      "assigned_to.technician": technician,
      "status.done.check": false,
    });

    const completeServiceRequests = await Service_Request.find({
      "assigned_to.technician": technician,
      "status.done.check": true,
    });

    const weeklyBookedServiceRequests = await Service_Request.find({
      "assigned_to.technician": technician,
      date: { $gte: startOfWeek, $lt: endOfWeek },
    });

    const weeklyDoneServiceRequests = await Service_Request.find({
      "assigned_to.technician": technician,
      "status.done.check": true,
      "status.done.date_time": { $gte: startOfWeek, $lt: endOfWeek },
    });

    const monthlyBookedServiceRequests = await Service_Request.find({
      "assigned_to.technician": technician,
      date: { $gte: startOfMonth, $lt: endOfMonth },
    });

    const monthlyDoneServiceRequests = await Service_Request.find({
      "assigned_to.technician": technician,
      "status.done.check": true,
      "status.done.date_time": { $gte: startOfMonth, $lt: endOfMonth },
    });

    sortedResult.push({
      incomplete: incompleteServiceRequests.length,
      complete: completeServiceRequests.length,
      weeklyBooked: weeklyBookedServiceRequests.length,
      weeklyDone: weeklyDoneServiceRequests.length,
      monthlyBooked: monthlyBookedServiceRequests.length,
      monthlyDone: monthlyDoneServiceRequests.length,
    });

    res.status(200).send({ ticketData: sortedResult, serviceStats });

    // return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(`Error: ${error}`);
  }
});

//editTechnician --> update ticket -/ inventory mail
//editInventory --> ticket -/ requested parts -/ check if parts are present -/ parts -/ update ticket
//in progress --. Done //OTP crct

//vehicles
router.post("/vehicles", isAuthenticated, async (req, res) => {
  try {
    const { role, mob_number } = req.user;

    if (!role) {
      res.status(401).send("Not Authorized to perform this Operation");
      return;
    }

    if (role !== "Owner") {
      res.status(401).send("Not Authorized to perform this Operation");
      return;
    }

    const riders = await Rider.find({ owner_mob: mob_number });

    if (!riders) {
      res.status(400).send("No rider found with this mob number");
    }

    const vehicle_numbers = riders.map((rider) => {
      return rider.vehicle_no;
    });

    const vehiclePlan = {
      SH: "SH",
      SS: "SS",
      FR: "FR",
      SF: "SF",
    };

    const filteredPlans = vehicle_numbers.map((vehicle_no) => {
      const code = Object.keys(vehiclePlan).find((key) =>
        vehicle_no.includes(key)
      );
      const matchingCode = vehiclePlan[code];
      return { vehicle_no, matchingCode };
    });

    const matchingCodes = filteredPlans.map((item) => item.matchingCode);

    const query = { sortName: { $in: matchingCodes } };

    const plan = await Plan.find(query).select("-_id");

    if (!plan) {
      res.status(400).send("Rider plan not found ");
    }

    res.status(200).send(plan);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

//location
router.post("/getlocations", isAuthenticated, async (req, res) => {
  try {
    // let data = await Location.find({}, { short_form: 1, full_form: 1, _id: 0 });
    const collection = db.collection("cities");

    // Fetch data and convert cursor to an array
    const data = await collection.find({}).toArray();

    res.json({
      message: "OK",
      data,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/addLocation", isAuthenticated, async (req, res) => {
  try {
    const { name, countryCode, stateCode, cityCode } = req.body;

    if (!name || !countryCode || !stateCode || !cityCode) {
      return res.status(400).json({ message: "All fields are required" });
    }

    console.log("Inserting:", { name, countryCode, stateCode, cityCode });

    // const db = mongoose.connection.db;

    // Access the 'cities' collection
    const collection = db.collection("cities");

    // Insert a new document
    const result = await collection.insertOne({
      name,
      countryCode,
      stateCode,
      cityCode,
      city_id: cityCode + "001",
    });

    console.log(result, "created");

    res.status(201).json({
      message: "City added successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//getallowners
router.post("/getallowners", isAuthenticated, async (req, res) => {
  try {
    const { role, location } = req.user;
    let data;

    if (role === "Admin") {
      data = await User.find({
        role: "Owner",
      });
    }

    if (role === "Technician" || role === "Manager" || role === "Employee") {
      data = await User.find({
        role: "Owner",
        location,
      });
    }

    const response = data.map((item) => {
      return {
        value: {
          name: item.name,
          mob_number: item.mob_number,
          email: item.email,
        },
        label: item.name,
      };
    });

    res.status(200).send(response);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

//get service requests data for a particlular date range
router.post("/getdataforDates", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    let locations = ["Kolkata", "Hyderabad", "NCR", "Chandigarh", "Bangalore"];

    let result = {
      Kolkata: {},
      Hyderabad: {},
      NCR: {},
      Chandigarh: {},
      Bangalore: {},
    };
    const options = { day: "2-digit", month: "2-digit", year: "2-digit" };

    let { from, to } = req.body.data;
    const startDate = new Date(from);
    const endDate = new Date(to);

    // Create a copy of the start date to use as a reference
    let currentDate = new Date(startDate);

    // Loop through the date range
    for (
      currentDate;
      currentDate <= endDate;
      currentDate.setDate(currentDate.getDate() + 1)
    ) {
      const currentEndTime = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        29,
        29,
        59,
        999
      );

      // Do something with the current date and current end time
      console.log("Current Date:", currentDate);
      console.log("Current End Time:", currentEndTime);

      const formattedDate = currentDate
        .toLocaleDateString("en-GB", options)
        .replace(/\//g, "-");

      console.log(formattedDate);

      for (let i = 0; i < locations.length; i++) {
        const location = locations[i];
        // console.log(location, result[location])

        result[location][formattedDate] = {
          created: 0,
          to_do: 0,
          in_progress: 0,
          done: 0,
          tickets: [],
          technicians: {},
        };

        let technicianList = await User.find({ role: "Technician", location });

        for (let i = 0; i < technicianList.length; i++) {
          const technician = technicianList[i].name;

          result[location][formattedDate]["technicians"][technician] = {
            total: 0,
            to_do: 0,
            in_progress: 0,
            done: 0,
          };
        }
      }

      let srData = await Service_Request.find(
        {
          date: { $gte: currentDate, $lte: currentEndTime },
          "assigned_to.check": true,
        },
        { date: 1, status: 1, location: 1, ticket_id: 1, assigned_to: 1 }
      );

      for (const ele of srData) {
        let date = ele.date;
        let location = ele.location;
        let status = "";
        let ticket_id = ele.ticket_id;
        let technician = ele.assigned_to.technician;

        if (ele["status"].done.check && technician) {
          result[location][formattedDate]["done"]++;
          result[location][formattedDate]["technicians"][technician]["done"]++;
        } else if (
          ele["status"].to_do.check &&
          ele["status"].in_progress.check &&
          technician
        ) {
          result[location][formattedDate]["in_progress"]++;
          result[location][formattedDate]["technicians"][technician][
            "in_progress"
          ]++;
          // console.log("here");
        } else if (technician) {
          result[location][formattedDate]["to_do"]++;
          result[location][formattedDate]["technicians"][technician]["to_do"]++;
        }

        result[location][formattedDate].tickets.push(ticket_id);
        result[location][formattedDate]["created"]++;
        if (technician)
          result[location][formattedDate]["technicians"][technician]["total"]++;
      }
    }
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/getDataByDates", async (req, res) => {
  try {
    const { data } = req.body;
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    let finalResult = [];

    // to get all technicians
    const user = await User.find({
      location: data.location,
      role: "Technician",
    });
    let userArr = [];
    let arrCopy = [];
    user.forEach((ele) => {
      userArr.push({
        technician: ele.name,
        created: 0,
        inProgress: 0,
        toDo: 0,
        done: 0,
      });
      arrCopy.push({
        technician: ele.name,
        created: 0,
        inProgress: 0,
        toDo: 0,
        done: 0,
      });
    });

    //to get all tickets for that date
    const result = await Service_Request.find({
      date: { $gte: startDate, $lte: endDate },
      location: data.location,
    });
    let startDay = startDate.getDate();
    let endDay = endDate.getDate();
    let resultArr = [];
    let helperVar = 0;
    let dateCount = 0;

    while (startDay <= endDay) {
      result.forEach((item) => {
        if (
          new Date(item.date.getTime() - 5.5 * 60 * 60 * 1000).getDate() ==
          startDay
        ) {
          helperVar++;
          dateCount++;
          userArr.map((ele) => {
            if (item.assigned_to.technician == ele.technician) {
              ele.created += 1;
              if (item.status.done.check == true) {
                ele.done += 1;
              } else {
                if (item.status.in_progress.check == true) {
                  ele.inProgress += 1;
                } else {
                  ele.toDo += 1;
                }
              }
            }
            // console.log(item.date,new Date(item.date.getTime()-5.5*60*60*1000).getDate());
            ele.location = data.location;
            ele.date = item.date;
          });
        } else {
          return;
        }
      });
      if (helperVar !== 0) finalResult = [...finalResult, ...userArr];
      if (dateCount == 0) {
        userArr.forEach((ele) => {
          ele.location = data.location;
          ele.date = new Date(
            new Date(
              `${startDate.getFullYear()}-${
                startDate.getMonth() + 1
              }-${startDay}`
            ).getTime() +
              5.5 * 60 * 60 * 1000
          );
        });
        finalResult = [...finalResult, ...userArr];
      }
      userArr = [];
      arrCopy.forEach((ele) => {
        userArr.push({ ...ele });
      });
      ++startDay;
      helperVar = 0;
      dateCount = 0;
    }
    // console.log(finalResult);
    res.json(finalResult);
  } catch (err) {
    res.status(500).json({ error: err, message: err.message });
  }
});

router.post("/getallrequesttypes", isAuthenticated, async (req, res) => {
  try {
    let data = await requestTypeDetail.find({}, { _id: 0, __v: 0 });

    res.status(200).send(data);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/createrequesttypes", isAuthenticated, async (req, res) => {
  try {
    let { request_types } = req.body.data;

    for (let request_type of request_types) {
      let counterData = await Counter.findOne({ id: "request_type_id" }).lean();
      // console.log(counterData, counterData["seq"]);

      let sequence = counterData.seq;
      console.log(sequence);

      if (sequence < 10) {
        sequence = `00${sequence}`;
      } else if (sequence >= 10 && sequence < 99) {
        sequence = `0${sequence}`;
      }
      console.log(sequence, "after");
      let requestTypeData = await requestTypeDetail.findOne({
        name: request_type,
      });

      if (!requestTypeData) {
        let newrequestTypeData = new requestTypeDetail({
          name: request_type,
          request_type_id: `REQ${sequence}`,
        });

        console.log(newrequestTypeData);

        await newrequestTypeData.save();
        await Counter.updateOne(
          { id: "request_type_id" },
          { seq: { $inc: 1 } }
        );
      }
    }
    return res
      .status(200)
      .json({ code: 1, message: "Data Saved Successfully" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ code: 1, message: "Error while saving data" });
  }
});

// Define storage for multer to store images in memory
const imagesStorage = multer.memoryStorage();
const imagesUpload = multer({ storage: imagesStorage, array: true });

router.post(
  "/gets3uploadurl",
  imagesUpload.array("images"),
  isAuthenticated,
  async (req, res) => {
    logroute(req);
    try {
      console.log(req.body);
      await uploadImagesToS3(req, res);
    } catch (error) {
      console.log(error);
      res.status(500).send(`Error: ${error}`);
    }
  }
);

// Define storage for multer to handle a single file
const fileStorage = multer.memoryStorage();
const fileUpload = multer({ storage: fileStorage });

router.post(
  "/getrequestsdone",
  fileUpload.single("file"),
  isAuthenticated,
  async (req, res) => {
    logroute(req);
    try {
      getRequestsDone(req, res);
    } catch (error) {
      console.log(error);
      res.status(500).send(`Error: ${error}`);
    }
  }
);

router.post(
  "/addmonthlyservicerequests",
  fileUpload.single("file"),
  isAuthenticated,
  async (req, res) => {
    logroute(req);
    try {
      addMonthlyServiceRequest(req, res);
    } catch (error) {
      console.log(error);
      res.status(500).send(`Error: ${error}`);
    }
  }
);

//stats page API
//get locationwise today requests
router.post("/gettodayservicerequests", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    getTodayLocAndStatus(req, res);
  } catch (error) {
    console.log(error);
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/getweeklyservicerequests", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    getWeeklyServiceRequests(req, res);
  } catch (error) {
    console.log(error);
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/getdailytechniciandata", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    getDailyTechnicianData(req, res);
  } catch (error) {
    console.log(error);
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/getweeklytechniciandata", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    getWeeklyTechnicianData(req, res);
  } catch (error) {
    console.log(error);
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/getmonthlytechniciandata", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    getMonthlyTechnicianData(req, res);
  } catch (error) {
    console.log(error);
    res.status(500).send(`Error: ${error}`);
  }
});

router.post("/getServiceRequestStats", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    getServiceRequestStats(req, res);
  } catch (error) {
    console.log(error);
    res.status(500).send(`Error: ${error}`);
  }
});

//These 3 APIs are for testing and are not related to the project
//Pavitar API 1
router.post("/getnumberforvehicle", async (req, res) => {
  logroute(req);
  try {
    let { vehicle_no } = req.body.data;

    let vehDetails = await Rider.findOne(
      { vehicle_no },
      { mob_number: 1, _id: 0 }
    );

    if (vehDetails) {
      res.status(200).json({ code: 1, data: vehDetails.mob_number });
    } else {
      res
        .status(400)
        .json({ code: 0, data: `Vehicle Number ${vehicle_no} Not Registered` });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ code: 0, data: `Error: ${error}` });
  }
});

//Pavitar API 2 - Battery Swap Portal;
router.post("/loginrider", async (req, res) => {
  logroute(req);
  try {
    const { vehicle_no, otp_verify } = req.body.data;
    if (!vehicle_no) {
      return res
        .status(400)
        .json({ code: 0, message: "Please fill all the required fields!" });
    }

    if (!otp_verify) {
      return res
        .status(400)
        .json({ code: 0, message: "Please verify OTP again" });
    }
    const riderdetails = await Rider.findOne({ vehicle_no });
    if (riderdetails) {
      const token = await riderdetails.generateAuthToken();

      res.status(200).json({
        message: "Rider Logged in Successfully!",
        token: token,
        riderDetails: {
          id: riderdetails._id,
          name: riderdetails.name,
          mob_number: riderdetails.mob_number,
          email: riderdetails.email,
          location: riderdetails.location,
          status: riderdetails.status,
          role: riderdetails.role,
          owner: riderdetails.owner,
          owner_email: riderdetails.owner_email,
          owner_mob: riderdetails.owner_mob,
          vehicle_no: riderdetails.vehicle_no,
        },
      });
    } else {
      res.status(400).json({ error: "Something went wrong" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Something went wrong" });
  }
});

router.post("/generateQRCode", isAuthenticated, async (req, res, next) => {
  logroute(req);
  try {
    let { driverName, vehicleNo, lat, lng } = req.query;
    const qrCodeTokenDetail = {
      driverName,
      vehicleNo,
      lat,
      lng,
      // model: Model,
      // location: Location,
    };
    console.log(req.query, "params");
    console.log(qrCodeTokenDetail, "qrcode");
    const baseUrl = process.env.DYNAMIC_QR_URL;
    const params = qrCodeTokenDetail;
    const accessToken = process.env.QRCODE_ACCESS_TOKEN;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    // Inside the axios GET request block
    let API_data = await axios
      .get(baseUrl, {
        params: params,
        headers: headers,
      })
      .then(async (response) => {
        // Handle the response here
        console.log("Response code:", response.status);
        console.log("Response data:", response.data);
        return { status: response.status, data: response.data };
      })
      .catch((error) => {
        // Handle errors here
        console.log("hfbvnbfvn");
        // console.error("Error:", error);
        return { status: error.response.status, data: error.response.data };
      });
    console.log("API Data", API_data);
    if (API_data.data.success !== true) {
      return res.status(API_data.status).json(API_data.data);
    }
    //get code
    let token = API_data.data.data.code;
    const qrExist = await QRCode.findOne({
      userId: new ObjectId(req.user._id),
    });
    console.log(qrExist);
    if (qrExist) {
      // if (qrExist.generationCount === 3) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "Max Swaps Limit  for a day reached!",
      //   });
      // }
      const data = await QRCode.findOneAndUpdate(
        { userId: req.user._id },
        {
          // $inc: { generationCount: 1 },
          $set: { token: token, disabled: false },
        }
      );
    } else {
      // console.log("else");
      const data = await QRCode.create({
        userId: req.user._id,
        token: token,
        // generationCount: 1,
      });
    }
    return res.status(API_data.status).json(API_data.data);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Data fetch failure, please try again!",
    });
  }
});

router.post("/scanQRCode", isAuthenticated, async (req, res, next) => {
  logroute(req);
  try {
    const { code } = req.body;

    const qrCode = await QRCode.findOne({ userId: code });
    if (!qrCode) {
      return res.status(400).send("QR Code not found");
    }

    const scanCode = await jwt.verify(qrCode.token, process.env.QRCODE_KEY);

    await QRCode.findOneAndUpdate({ _id: qrCode._id }, { isActive: true });
    const deviceData = {
      driverName: scanCode.driverName,
      vehicleNo: scanCode.vehicleNo,
      lat: scanCode.lat,
      lng: scanCode.lng,
      model: scanCode.model,
      location: scanCode.location,
    };
    res.status(200).json({ success: true, data: deviceData });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Something went wrong" });
    return;
  }
});

router.post("/getneareststation", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    // Function to calculate distance between two coordinates using Haversine formula

    let { lat, lng } = req.query;
    const baseUrl = process.env.NEAREST_PARTNER_URL;
    const params = {
      lng: parseFloat(lng),
      lat: parseFloat(lat),
    };
    const accessToken = process.env.QRCODE_ACCESS_TOKEN;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    let API_data;

    try {
      const response = await axios.get(baseUrl, {
        params: params,
        headers: headers,
      });

      API_data = { status: response.status, data: response.data };
    } catch (error) {
      console.log("Error:", error);
      if (error.response) {
        API_data = { status: error.response.status, data: error.response.data };
      } else {
        API_data = {
          status: 400,
          data: { success: false, message: error.message },
        };
      }
    }
    console.log("API Data", API_data);

    return res.status(API_data.status).json(API_data.data);
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      message: "Data fetch failure, please try again!",
    });
    return;
  }
});

//Pavitar API 3
router.post("/logoutrider", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    req.user.token = "NA";
    req.user.otp_verify = false;

    // Save the updated user in the database
    await req.user.save();

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/servicehistory", serviceHistory);
router.post("/updateticketstechnician", async (req, res) => {
  logroute(req);
  try {
    await updateTicketsToOtherTechnician(req, res);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ code: 0, data: error.message });
  }
});

// plan
router.post("/createPlan", createPlan);
router.post("/getAllPlans", getAllPlans);
router.post("/getPlanDetails", isAuthenticated, getPlanDetails);

//issue-type
router.post("/getallissuetype", getAllIssueType);
router.post("/createissuetype", createIssueType);

//teachician
router.put("/used-unused-part", isAuthenticated, serviceRequestParts);
router.post(
  "/updatesparepartsimage",
  isAuthenticated,
  serviceRequestPartsImage
);

router.post("/getAllservive-request", getAllServiceRequests);
router.post("/cutomer-link-usedpart", isAuthenticated, customerLinkUsedPart);

router.post("/getNotAssignedRequests", isAuthenticated, getNotAssignedRequests);
router.post(
  "/getStillInProgressRequests",
  isAuthenticated,
  getStillInProgressRequests
);
router.post("/getNotDoneRequests", isAuthenticated, getNotDoneRequests);
router.post(
  "/getRequestTypesCount/:timeSpan",
  isAuthenticated,
  getRequestTypesCount
);
router.post("/getIssueTypeStats", isAuthenticated, getIssueTypesCount);
router.post("/getPartsData", async (req, res) => {
  const date = new Date();
  const lastDate = new Date("2023-08-01");
  const currentDate = new Date(
    `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  );
  console.log(currentDate.getMonth(), lastDate.getMonth());
  let resultObj = {};
  const data = InventoryDetails.find(
    {
      date: {
        $gte: new Date(lastDate),
        $lte: new Date(currentDate),
      },
      operation: "stock_out",
      location: req.body.location,
    },
    (err, doc) => {
      if (err) console.log(err);
      else {
        // res.json(doc);
        doc.map((ele) => {
          if (resultObj.hasOwnProperty(ele.parts[0].product_name)) {
            resultObj[ele.parts[0].product_name] =
              resultObj[ele.parts[0].product_name] + ele.parts[0].count;
          } else {
            resultObj[ele.parts[0].product_name] = ele.parts[0].count;
          }
        });
        res.json(resultObj);
      }
    }
  );
});

router.post("/getTicketStatus", isAuthenticated, async (req, res) => {
  logroute(req);
  try {
    const role = req.user.role;
    const location = req.user.location;
    const { ticket_id } = req.body;

    if (role !== "Inventory Manager" && role !== "Manager") {
      return res.status(401).send("Not Authorized to perform this Operation");
    }

    // get ticket data(mainly look for requested parts)
    // requestedParts arr=[] in tkt data----> ticket resolved
    // requestedParts arr!=[] in tkt data---->ticket still pending with some parts
    const ticketData = await Service_Request.findOne({ location, ticket_id });
    res.send(ticketData);
  } catch (error) {
    res
      .status(500)
      .json({ code: 0, message: "Something went wrong!Please try again" });
  }
});
router.post("/technicianAverageTime", isAuthenticated, getAverageTime);
router.post(
  "/delayedAndOnTimeTasks",
  isAuthenticated,
  getOnTimeAndDelayedTasks
);
router.post("/customerReview", addCustomerReview);
router.post("/getPerHourTickets", isAuthenticated, ticketsPerHour);
router.post("/notRepairedVehicles", async (req, res) => {
  const location = "Kolkata";
  const currentTime = new Date().getTime();
  const requiredTime = currentTime - 60 * 24 * 60 * 60 * 1000;
  try {
    const vehicleNames = await vehicleDetails
      .find({ Location: location }, { _id: 0, "Vehicle Name": 1 })
      .distinct("Vehicle Name");

    const serviceData = await Service_Request.find({
      date: { $gte: new Date(requiredTime) },
      location,
    }).distinct("vehicle");

    serviceData.forEach((ele, i) => {
      serviceData[i] = ele.slice(5);
    });
    const resultVehicles = vehicleNames.filter((vehicle) => {
      if (!serviceData.includes(vehicle.slice(5))) return vehicle;
    });
    // res.json(serviceData);
    res.json({ [location]: resultVehicles });
  } catch (error) {
    res.status(500).send("Something Went Wrong");
  }
});
router.post("/getServiceData", async (req, res) => {
  const location = req.body.data.location;
  const date = new Date(req.body.data.Date);
  const requiredTime = date.getTime() + 5.5 * 60 * 60 * 1000;
  try {
    const data = await Service_Request.find({
      closure_date: {
        $gte: new Date(requiredTime),
        $lt: new Date("2023-11-17"),
      },
      location: location,
    });
    const resultArr = data.map((ele) => {
      return {
        Ticket: ele.ticket_id,
        Closure_Date: ele.closure_date,
        // Vehicle: ele.vehicle,
        // Date: ele.date,
        // customerName: ele.customer_name,
        // CustomerNumber: ele.customer_mobile,
        // CustomerEmail: ele.customer_email,
        Location: ele.location,
        Technician: ele.assigned_to.technician,
        // RequestType: ele.request_type,
        // Status: {
        //   To_Do: ele.status.to_do.check,
        //   In_Progress: ele.status.in_progress.check,
        //   Done: ele.status.done.check,
        // },

        Spare_Parts: ele.spare_parts.map((part) => {
          return {
            Name: part.product_name,
            Count: part.count,
            Used_Count: part.used_count,
            Unused_Count: part.unused_count,
          };
        }),
      };
    });
    res.json(resultArr);
  } catch (err) {
    res.status(500).send("Server error: " + err.message);
  }
});

router.post("/addsparepartprice", async (req, res) => {
  const { partList } = req.body;
  try {
    for (let i = 0; i < partList.length; i++) {
      const partObj = partList[i];
      partObj["cost_price"] = Number(partObj["cost_price"]);
      partObj["rider_price"] = Number(partObj["rider_price"]);
      console.log("Index ", i);

      console.log(
        typeof partObj["cost_price"],
        " ",
        typeof partObj["rider_price"]
      );
      console.log(partObj);
      let newSparePartDocument = new sparepartspricelist(partObj);
      await newSparePartDocument.save();
    }
    res.send("Successfully uploaded");
  } catch (e) {
    console.log("error", e);
    res.status(404).send({ Error: e });
  }
});

router.post("/getsparepartsmonthlyprofit", async (req, res) => {
  try {
    const date = new Date();
    const lastMonth = date.getMonth() - 1;
    date.setMonth(lastMonth);
    const ServiceData = await Service_Request.find({
      date: { $gte: date.toISOString() },
      "status.done.check": true,
      spare_parts: { $ne: [] },
    });

    let profit_data = [];

    for (let i = 0; i < ServiceData.length; i++) {
      const serviceObj = ServiceData[i];
      const location = serviceObj.location;
      const objIndex = profit_data.findIndex((obj) => obj.location == location);

      // if location obj not present in profit_data[] then append it.
      if (objIndex == -1) {
        profit_data.push({ location, costprice: 0, profit: 0 });
      }

      const sparePartsArr = serviceObj.spare_parts;
      let totalCostPrice = 0;
      let totalProfit = 0;
      // traversing each spare_part for that service_request
      for (let j = 0; j < sparePartsArr.length; j++) {
        const make = sparePartsArr[j].make;
        const spare_part_name = sparePartsArr[j].product_name;
        const partCount = sparePartsArr[j].count;

        const SparePartDetails = await sparepartspricelist.findOne({
          make,
          spare_part_name,
        });
        if (SparePartDetails) {
          totalCostPrice =
            totalCostPrice + partCount * SparePartDetails.cost_price;
          totalProfit =
            totalProfit +
            partCount *
              (SparePartDetails.rider_price - SparePartDetails.cost_price);
        }
      }

      const objToAppend = profit_data.find((obj) => obj.location == location);
      objToAppend.costprice += totalCostPrice;
      objToAppend.profit += totalProfit;
    }
    res.status(200).send(profit_data);
  } catch (e) {
    console.log("Error", e);
    res.status(404).send(e);
  }
});

router.post("/getvehicleidbylocation", async (req, res) => {
  const location = req.body.location;
  try {
    // Retrieve vehicle names from vehicleDetails
    const vehicleNames = await vehicleDetails
      .find({ Location: location }, { _id: 0, "Vehicle Name": 1 })
      .distinct("Vehicle Name");
    // Retrieve vehicle numbers from rider
    const riderVehicleNumbers = await Rider.find(
      { location: location },
      { _id: 0, vehicle_no: 1 }
    ).distinct("vehicle_no");

    // Combine and remove duplicates
    const allVehData = [...new Set([...vehicleNames, ...riderVehicleNumbers])];

    const groupedVehicles = [];
    let row = [];

    for (let index = 0; index < allVehData.length; index++) {
      const vehicle = allVehData[index];

      row.push(vehicle);
      if ((index + 1) % 3 === 0 || index === allVehData.length - 1) {
        groupedVehicles.push(row);
        row = [];
      }
    }
    res.status(200).send(groupedVehicles);
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
});
router.post("/getLastSixMonthsStats", isAuthenticated, getLastSixMonthsStats);
router.post("/gettempdata", async (req, res) => {
  const location = "Bangalore";
  const resultArr = [];
  const data = await Service_Request.find({
    closure_date: {
      $gte: new Date("2024-04-01"),
      $lte: new Date("2024-05-01"),
    },
    location,
  });
  data.forEach((ele) => {
    resultArr.push({
      ticket_id: ele.ticket_id,
      vehicle: ele.vehicle,
      location: ele.location,
      customerName: ele.customer_name,
      customer_mobile: ele.customer_mobile,
      created_date: ele.date,
      close_date: ele.closure_date,
      technician: ele.assigned_to.technician,
      spareParts: ele.spare_parts.map((item) => {
        return {
          name: item.product_name,
          used_count: item.used_count,
          unused_count: item.unused_count,
        };
      }),
      requestedParts: ele.requested_parts.map((item) => {
        return {
          name: item.product_name,
          used_count: item.used_count,
          unused_count: item.unused_count,
        };
      }),
    });
  });
  res.json(resultArr);
});

router.post("/getmonthlyticketdata", async (req, res) => {
  const location = "Bangalore";
  const resultArr = [];
  const data = await Service_Request.find({
    $and: [
      {
        date: {
          $lt: new Date("2024-05-01"),
        },
      },
      {
        closure_date: null,
      },
    ],
    //  date:{$gte: new Date("2024-05-01")},
    request_type: "Monthly Service",
    location,
  });

  for (let i = 0; i < data.length; i++) {
    const vehicleNumber = data[i].vehicle;
    const vehicleData = await Service_Request.findOne({
      vehicle: vehicleNumber,
    }).sort({ closure_date: -1 });
    console.log(vehicleData);
    resultArr.push({
      vehicle: vehicleData.vehicle,
      date: vehicleData.date,
      closure_date: vehicleData.closure_date,
      request_type: vehicleData.request_type,
      customer_name: vehicleData.customer_name,
      customer_mobile: vehicleData.customer_mobile,
      technician: vehicleData.assigned_to.technician,
    });
  }

  // data.forEach((ele) => {
  //   resultArr.push({
  //     ticket_id: ele.ticket_id,
  //     vehicle: ele.vehicle,
  //     location: ele.location,
  //     customerName: ele.customer_name,
  //     customer_mobile: ele.customer_mobile,
  //     created_date: ele.date,
  //     close_date: ele.closure_date,
  //     technician: ele.assigned_to.technician,
  //     requestType:ele.request_type,
  //     // spareParts: ele.spare_parts.map((item) => {
  //     //   return {
  //     //     name: item.product_name,
  //     //     used_count: item.used_count,
  //     //     unused_count: item.unused_count,
  //     //   };
  //     // }),
  //     // requestedParts: ele.requested_parts.map((item) => {
  //     //   return {
  //     //     name: item.product_name,
  //     //     used_count: item.used_count,
  //     //     unused_count: item.unused_count,
  //     //   };
  //     // }),
  //   });
  // });
  res.json(resultArr);
});

router.post("/weeklyAnalysis", isAuthenticated, getWeeklyAnalysis);
router.post("/technicianPerformance", isAuthenticated, technicianPerformance);

router.post("/updatepartsprice", fileUpload.single("file"), updatePartsPrice);
router.post("/getpartsprice", isAuthenticated, partsPrice);

router.post("/addAppsRequest", (req, res) => {
  addAppsRequest(req, res);
});

router.delete("/deleteOldData", isAuthenticated, async (req, res) => {
  try {
    const data = await Service_Request.deleteMany({
      $and: [
        {
          date: {
            $lt: new Date("2024-10-01"),
          },
        },
        {
          closure_date: null,
        },
      ],
    });
    res.json(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.delete("/deleteOldData", isAuthenticated, async (req, res) => {
  try {
    const data = await Service_Request.deleteMany({
      $and: [
        {
          date: {
            $lt: new Date("2024-10-01"),
          },
        },
        {
          closure_date: null,
        },
      ],
    });
    res.json(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post("/closeOldTickets", isAuthenticated, async (req, res) => {
  const date = new Date("2024-12-31");
  const data = await Service_Request.updateMany(
    {
      date: {
        $lt: date,
      },
      location: { $in: ["NCR", "Bangalore"] },
      closure_date: null,
    },
    {
      closure_date: date,
      "status.done.check": true,
      "status.done.date_time": date,
    }
  );
  res.json(data);
});

// router.post("/timeDifData", isAuthenticated, async (req, res) => {
//   const startDate = new Date("2024-12-01");
//   const endDate = new Date("2024-12-30");
//   let resultData = [];

//   // Fetch data from the database
//   let data = await Service_Request.find(
//     {
//       date: {
//         $lte: endDate,
//         $gte: startDate,
//       },
//       closure_date: { $lte: endDate, $gte: startDate },
//     },
//     {
//       ticket_id: 1,
//       customer_name: 1,
//       customer_mobile: 1,
//       vehicle: 1,
//       location: 1,
//       date: 1,
//       closure_date: 1,
//       request_type: 1,
//       "assigned_to.technician": 1,
//     }
//   );
//   let count = 0;
//   let totalTime = 0;

//   // Process each service request
//   data.forEach((ele) => {
//     const randomTime = getRandomIntInclusive(1, 30);
//     console.log(
//       ele.date,
//       new Date(ele.date),
//       new Date(new Date(ele.date).getTime() + randomTime * 60 * 60 * 1000),
//       randomTime
//     );
//     if (ele.closure_date && ele.date) {
//       // const diffMs = Math.abs(new Date(ele.closure_date) - new Date(ele.date));
//       // const diffHours = diffMs / (1000 * 60 * 60); // Exact difference in hours
//       const diffHours = randomTime;
//       count++;
//       totalTime += parseFloat(diffHours); // Calculate total time difference
//       // Add to the result data
//       resultData.push({
//         ticket_id: ele.ticket_id,
//         customer_name: ele.customer_name,
//         customer_mobile: ele.customer_mobile,
//         vehicle: ele.vehicle,
//         location: ele.location,
//         date: ele.date,
//         closure_date: new Date(
//           new Date(ele.date).getTime() + randomTime * 60 * 60 * 1000
//         ),
//         request_type: ele.request_type,
//         "assigned_to.technician": ele.assigned_to.technician,
//         exact_hours_difference: diffHours, // Exact time difference in hours (2 decimal points)
//       });
//     }
//   });

//   // Respond with the result data
//   res.json({ resultData, average: totalTime / count });
// });

router.post("/timeDifData", isAuthenticated, async (req, res) => {
  const startDate = new Date("2025-03-15");
  const endDate = new Date("2025-03-22");
  let resultData = [];

  // Fetch data from the database
  let data = await Service_Request.find(
    {
      // date: {
      //   $lte: endDate,
      //   $gte: startDate,
      // },
      closure_date: { $lte: endDate, $gte: startDate },
      location : 'NCR'
    },
    {
      ticket_id: 1,
      customer_name: 1,
      customer_mobile: 1,
      vehicle: 1,
      location: 1,
      date: 1,
      closure_date: 1,
      request_type: 1,
      "assigned_to.technician": 1,
    }
  );

  let count = 0;
  let totalTime = 0;

  // Process each service request
  data.forEach((ele) => {
    if (ele.closure_date && ele.date) {
      // Calculate actual time difference in hours
      const diffMs = Math.abs(new Date(ele.closure_date) - new Date(ele.date));
      const diffHours = diffMs / (1000 * 60 * 60); // Convert milliseconds to hours

      count++;
      totalTime += diffHours; // Sum the total time difference

      // Add to the result data
      resultData.push({
        ticket_id: ele.ticket_id,
        customer_name: ele.customer_name,
        customer_mobile: ele.customer_mobile,
        vehicle: ele.vehicle,
        location: ele.location,
        date: ele.date,
        closure_date: ele.closure_date,
        request_type: ele.request_type,
        "assigned_to.technician": ele.assigned_to.technician,
        exact_hours_difference: parseFloat(diffHours.toFixed(2)), // Round to 2 decimal places
      });
    }
  });

  // Calculate average time difference
  const averageTime = count > 0 ? totalTime / count : 0;

  // Respond with the result data
  res.json({ resultData, average: parseFloat(averageTime.toFixed(2)) });
});
function getRandomIntInclusive(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return (Math.random() * (maxFloored - minCeiled + 1) + minCeiled).toFixed(2); // The maximum is inclusive and the minimum is inclusive
}

router.post("/storeTicketRequests", isAuthenticated, async (req, res) => {
  storeRequests(req, res);
});

router.post("/getTicketRequests", isAuthenticated, async (req, res) => {
  getAllRequests(req, res);
});

router.post("/handleRequestStatus", isAuthenticated, async (req, res) => {
  handleRequests(req, res);
});

// const baseUrl = "http://eveez.in:7001";

// Function to fetch asset types
const getAssetTypes = async (params) => {
  const query = `
    SELECT DISTINCT typ.asset_type_id, asset_type_name, asset_type_code, speed_type, FUP, typ.active
    FROM asset_type AS typ
    INNER JOIN asset_type_wise_rental ren ON typ.asset_type_id = ren.asset_type_id
    WHERE ( ? IS NULL OR typ.asset_type_id = ? )
      AND ( ? IS NULL OR ren.company = ? )
      AND ( ? IS NULL OR typ.active = ? )`;
  
  const values = [
    params.asset_type_id, params.asset_type_id,
    params.company_name, params.company_name,
    params.active, params.active
  ];

  const [rows] = await pool.query(query, values);
  return rows;
};

// Function to fetch asset features
const getAssetFeatures = async (assetTypeId) => {
  const query = `
    SELECT asset_feature_id, feat.asset_type_id, typ.asset_type_name, asset_feature_name,
           asset_feature_desc, asset_feature_value
    FROM asset_type_features feat
    INNER JOIN asset_type typ ON feat.asset_type_id = typ.asset_type_id
    WHERE feat.asset_type_id = ? AND feat.active = 1`;

  const [rows] = await pool.query(query, [assetTypeId]);
  return rows.length > 0 ? rows : [];
};

// Function to fetch asset rentals
const getAssetRental = async (assetTypeId, companyName,city_id) => {
  const query = `
    SELECT asset_rental_id, rental.asset_type_id, typ.asset_type_name, country_id,
           state_id, IFNULL(company, '') AS company, duration, ROUND(amount, 0) AS amount,
           security_deposit, start_date, end_date, gst
    FROM asset_type_wise_rental rental
    INNER JOIN asset_type typ ON rental.asset_type_id = typ.asset_type_id
    WHERE rental.asset_type_id = ? 
      AND ( ( ? IS NULL AND company IS NULL ) OR company = ? )
      AND rental.active = 1
      AND ( (? IS NULL AND city_id IS NULL) OR city_id = ? )`;

  const values = [assetTypeId, companyName,companyName,city_id,city_id];
  const [rows] = await pool.query(query, values);
  return rows.length > 0 ? rows : [];
};

// API endpoint to get asset plans
router.post("/assets", async (req, res) => {
  try {
    const { city_id } = req.body;
    const asset_type_id = null;
    const active = 1;
    const companyName = req.body.company_name || null;

    const assetsType = await getAssetTypes({ asset_type_id, companyName, active });

    if (assetsType.length === 0) {
      return res.json({
        asset_plans: {
          status: 404,
          error: "Subscriber assets not found.",
          data: { assettype: [] }
        }
      });
    }

    for (let asset of assetsType) {
      asset.asset_url = `${process.env.APP_URL}/public/images/assettype/${asset.asset_type_id}.png`;
      asset.quantity = 0;
      asset.active = { type: "Buffer", data: [asset.active] };

      asset.asset_features = await getAssetFeatures(asset.asset_type_id);
      asset.asset_rental = await getAssetRental(asset.asset_type_id, companyName,city_id == 15 || city_id == 18 || city_id == 20 || city_id == 23 || city_id == 12 || city_id == 25 ? city_id : null);
    }

    return res.json({
      asset_plans: {
        status: 200,
        error: "OK",
        data: { assettype: assetsType }
      }
    });

  } catch (error) {
    console.error("Error fetching asset plans:", error);
    return res.status(500).json({
      asset_plans: {
        status: 500,
        error: "Internal Server Error",
        data: { assettype: [] }
      }
    });
  }
});

router.post('/getServiceDataBasedOnQuery',getServiceDataBasedOnQuery);

router.delete('/deleteServiceData/:ticketId',deleteServiceData);


module.exports = router;
