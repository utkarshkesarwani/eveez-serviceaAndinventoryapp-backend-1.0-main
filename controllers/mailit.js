const { mail } = require("./mail");
const User = require("../model/user");
const { sendEmail } = require("../middlewares/sendEmail");

async function mailtomanager(location, record) {
  try {
    const managerDetails = await User.findOne(
      { location},
      { email: 1 }
    );
    if (!managerDetails ) {
      console.log("Could Not Find Manager");
      return 0;
    }
    console.log("m", managerDetails);
    
    let ticketId = record.ticket_id
    let managerEmail = managerDetails.email
    
    const message = `Dear Branch Manager, A new service request has been booked at your branch.Please look into it ASAP. Service Request Details: Service_Request ID: ${ticketId}, VehicleID: ${record.vehicle}`;

    try {
      await sendEmail({
        email: managerEmail,
        subject: `New Service Request Booked! Service Request ID: ${ticketId}`,
        message
      });
    } catch (error) {
      console.log(error);
    }

  } catch (error) {
    console.log(error);
    console.log(
      "Could Not send Email.There might be problem in fetching the Manager "
    );
    return 0;
  }
}
module.exports = { mailtomanager };
