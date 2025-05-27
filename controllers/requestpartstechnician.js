const Service_Request = require("../model/servicerequest");
const { getProductByMakeAndProductName } = require("./findobject");

async function requestParts(ticketId, requestedParts, technician, location, imageUrls) {
  try {
    let resObj;
    console.log("Received image URLs", imageUrls);

    let data = await Service_Request.findOne({ ticket_id: ticketId });

    if (!data) {
      resObj = { code: 404, message: "Ticket ID not found" };
      return resObj;
    }

    for (let i = 0; i < requestedParts.length; i++) {
      const requestedPart = requestedParts[i];

      let partsData = await getProductByMakeAndProductName(
        requestedPart.make,
        requestedPart.product_name,
        data.requested_parts
      );

      if (partsData !== -1) {
        // Update existing part
        partsData.count += requestedPart.count;

        const imageUrl = imageUrls[i];

        if (imageUrl) {
          console.log(`Found image URL for ${requestedPart.product_name}: ${imageUrl}`);
        } else {
          console.log(`No image URL found for ${requestedPart.product_name}`);
        }

        // Assign the image URL and keep the old one if none is provided
        partsData.part_image.old_part_image.image = imageUrl || partsData.part_image.old_part_image.image || null;

        // Automatically set Approved and Rejected as false if not present
        partsData.Approved = partsData.Approved !== undefined ? partsData.Approved : false;
        partsData.Rejected = partsData.Rejected !== undefined ? partsData.Rejected : false;
      } else {
        // Add a new part
        const newPart = {
          make: requestedPart.make,
          product_name: requestedPart.product_name,
          count: requestedPart.count,
          Approved: false,
          Rejected: false,
          part_image: {
            old_part_image: {
              image: imageUrls[i] || null,
            },
          },
          date: new Date(),
        };

        data.requested_parts.push(newPart);
      }
    }

    await data.save();

    resObj = {
      code: 1,
      message: "Parts requested successfully",
      details: data,
    };

    return resObj;
  } catch (error) {
    console.log(error);
    let resObj = {
      code: 400,
      message: `Error: ${error}`,
    };
    return resObj;
  }
}

module.exports = {
  requestParts,
};
