const { sendEmail } = require("../middlewares/sendEmail");

async function sendMailtoManager(managerEmail, record) {
  try {
    const message = `Dear Branch Manager, A new service request has been booked at your branch.Please look into it ASAP. Service Request Details:
    
    Asset: ${record.vehicle},
    Customer Name: ${record.customer_name}
    Customer Mobile: ${record.customer_mobile}
    Odometer Reading: ${record.odometer_reading},
    Request_Type: ${record.request_type}
    Description: ${record.issue_description}`;

    await sendEmail({
      email: managerEmail,
      subject: `New Service Request Booked! VehicleID: ${record.vehicle}`,
      message,
    });
  } catch (error) {
    res.status(500).send("Could not send email to Manager");
    console.error(error);
    return;
  }
}

async function sendTechnicianMailtoManager(managerEmail, technician, record) {
  try {
    const message = `Dear Branch Manager, Technician ${technician} booked a new service request at your branch.Please look into it ASAP. Service Request Details: Service Request: SR${record.ticket_no}
      
      Asset Details: 

      Asset: ${record.vehicle},
      Customer Name: ${record.customer_name}
      Customer Mobile: ${record.customer_mobile}
      Odometer Reading: ${record.odometer_reading},
      Request_Type: ${record.request_type}
      Description: ${record.issue_description}`;

    await sendEmail({
      email: managerEmail,
      subject: `New Service Request Booked! VehicleID: ${record.vehicle}`,
      message,
    });
  } catch (error) {
    console.error(error);
    // throw error;
    return;
  }
}

async function sendMailtoInventoryManager(
  invetoryManagerMail,
  technician,
  requestedParts,
  ticketId
) {
  let message = `Dear Inventory Manager, Technician ${technician} requested the following parts for Service Request ID ${ticketId}: `;

  for (const part of requestedParts) {
    message += `${part.count} x ${part.product_name}, `;
  }

  console.log(message);

  await sendEmail({
    email: invetoryManagerMail,
    subject: `Technician ${technician} requested for parts`,
    message,
  });
}

module.exports = {
  sendMailtoManager,
  sendTechnicianMailtoManager,
  sendMailtoInventoryManager,
};
