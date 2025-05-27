const Service_Request = require("../model/servicerequest");
const User = require("../model/user");
const Rider = require("../model/rider");
const { sendEmail } = require("../middlewares/sendEmail");

async function assignTechnician(ticketId, technicianId) {
  try {
    let data = await Service_Request.find({ ticket_id: ticketId });

    if (!data) {
      let resObj = { code: 404, message: "Ticket ID not found" };
      return resObj;
    }

    //find if the ticketid is from rider
    const custVehID = data[0].vehicle;

    //find rider and owner and mail them about the technician assigned for their request
    let riderDetails = await Rider.find({
      vehicle_no: custVehID,
    });

    //send mail if the id is from rider
    // if (riderDetails.length > 0) {
    //   console.log("here");
    //   let riderEmail = riderDetails[0].email;
    //   let ownerEmail = riderDetails[0].owner_email;

    //   console.log("cudhb", data, custVehID);

    //   const Ridermessage = `Manager assigned technician  for your service request. Service Request Details: Service_Request ID: ${ticketId}, VehicleID: ${custVehID}`;

    //   console.log(riderEmail);

    //   try {
    //     await sendEmail({
    //       email: riderEmail,
    //       subject: `Assigned Service Request ${ticketId} to technician ${technician}`,
    //       message: Ridermessage,
    //     });
    //   } catch (error) {
    //     let resObj = { code: 400, message: "Unable to send email to rider" };
    //     console.log(error);
    //     return resObj;
    //   }

    //   try {
    //     await sendEmail({
    //       email: ownerEmail,
    //       subject: `Assigned Service Request ${ticketId} to technician ${technician}`,
    //       message: Ridermessage,
    //     });
    //   } catch (error) {
    //     let resObj = { code: 400, message: "Unable to send email to owner" };
    //     console.log(error);
    //     return resObj;
    //   }
    // }

    // find technician mail and send mail that he has been assigned for a request
    let technicianData = await User.findOne({
      role: "Technician",
      // name: technician,
      _id: technicianId
    });

    // console.log(technicianData);

    //technician add
    //data save

    // let technicianMail = technicianData.email;
    // console.log("techMail", technicianMail);

    // const message = `Manager assigned you a service request, please have a view. Service Request Details: Service_Request ID: ${ticketId}
    
    // Asset Details:
    
    //   Asset: ${custVehID},
    //   Customer Name: ${data[0].customer_name}
    //   Customer Mobile: ${data[0].customer_mobile}
    //   Odometer Reading: ${data[0].odometer_reading},
    //   Request_Type: ${data[0].request_type}
    //   Description: ${data[0].issue_description}`;

    // try {
    //   await sendEmail({
    //     email: technicianMail,
    //     subject: `Assigned Service Request ${ticketId}`,
    //     message,
    //   });
    // } catch (error) {
    //   console.log(error);
    //   let resObj = `Unable to send email to ${technicianData.name}`;
    //   console.log(error);
    //   return resObj;
    // }

    data[0].assigned_to.technician = technicianData.name;
    data[0].assigned_to.date_time = new Date().getTime() + 5.5*60*60*1000;
    data[0].assigned_to.id = technicianData._id
    data[0].assigned_to.check = true;

    await data[0].save();
    let resObj = {
      code: 1,
      message: `Technician ${technicianData.name} assigned to service request ${ticketId}`,
      details: data[0],
    };
    return resObj;
  } catch (error) {
    console.log(error);
    await Service_Request.deleteOne({ ticket_id: ticketId });
    let resObj = {
      code: 400,
      message: `Unable to assign technician`,
    };
    return resObj;
  }
}

async function checkTechnicianAlreadyAssigned(ticketId, technician) {
  try {
    let data = await Service_Request.find({ ticket_id: ticketId });

    console.log(data);

    if (data.length === 0) {
      let resObj = { code: 404, message: "Ticket ID not found" };
      return resObj;
    }
    //console.log(data);

    //find if the ticketid is from rider
    let custVehID = data[0].vehicle;
    let riderDetails = await Rider.find({
      vehicle_no: custVehID,
    });
    console.log("rider", riderDetails);

    if (data[0].assigned_to.check === true) {
      let resObj = { code: 208, message: "Technician Already Assigned" };
      return resObj;
    }

    let resObj = { code: 0, message: "Continue" };
    return resObj;
  } catch (err) {
    let resObj = { code: 400, message: "Error! Please try again" };
    console.log(err);
    return resObj;
  }
}

module.exports = {
  assignTechnician,
  checkTechnicianAlreadyAssigned,
};
