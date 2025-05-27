const xlsx = require("xlsx");
const Service_Request = require("../model/servicerequest");

// const filePath =
//   "C:/Users/Abubakar Shaikh/OneDrive/Desktop/Eveez Copy/GitHUb Service WEBAPP/stacker_backend/ClosingTickets.xlsx";
// const workbook = XLSX.readFile(filePath);
// const worksheet = workbook.Sheets[workbook.SheetNames[0]];
// const data = XLSX.utils.sheet_to_json(worksheet);
// console.log(data);

async function getRequestsDone(req, res) {
  try {
    let result = [];

    let file = req.file;
    console.log(req.body, file);

    // use xlsx to convert buffer data into JSON
    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    console.log(jsonData);

    for (const ticket of jsonData) {
      let ticketId = ticket.ticket_id.toUpperCase();
      let excelSheetdate = ticket.Date;
      console.log(ticketId);
      // let location = "NCR";

      let data = await Service_Request.findOne({ ticket_id: ticketId });

      /*
      if (!data.status.done.check) {
        console.log(ticketId);
      } */

      if (!data) {
        console.log(data, ticket, ticket.ticket_id);
        result.push("Ticket ID not found " + ticketId);
      } else {
        // console.log(ticketId);

        let doneStatus = data.status.done.check;
        if (doneStatus === false) {
          console.log(ticketId, "Not Done", doneStatus);
          if (data.issue_photo.length === 0) {
            result.push(
              `Please upload an image to get Ticket ${ticketId} Done`
            );
            continue;
          }

          let inProgressDate = data.status.in_progress.date_time;
          if (!inProgressDate) {
            let toDoDate = data.status.to_do.date_time;

            inProgressDate = new Date(
              toDoDate.setHours(toDoDate.getHours() + 1)
            );
            // console.log(ticketId);
            console.log("todo", toDoDate);
            console.log("inProgress", inProgressDate);

            let in_progress = {
              check: true,
              date_time: inProgressDate,
            };
            // console.log(to_do);

            data.status.in_progress = in_progress;
            await data.save();
            // console.log("done", doneDate);
          }

          console.log("in_p", inProgressDate);

          let doneDate = new Date(
            inProgressDate.setHours(
              inProgressDate.getHours(),
              inProgressDate.getMinutes() + 30
            )
          );
          console.log("done before", doneDate);

          if (excelSheetdate) {
            excelSheetdate = excelDateToJSDate(excelSheetdate);
            excelSheetdate = new Date(excelSheetdate);
            let formattedExcelDate = formatDateToDDMMYYYY(excelSheetdate);
            console.log(excelSheetdate, formattedExcelDate);
            let formattedDoneDate = formatDateToDDMMYYYY(doneDate);

            console.log("shgdgh", formattedDoneDate, formattedExcelDate);
            // Compare if the dates are equal

            if (formattedDoneDate !== formattedExcelDate) {
              excelSheetdate.setHours(21, 20, 48, 0);
              if (excelSheetdate > inProgressDate) {
                doneDate = new Date(excelSheetdate);
              }
            }
          }

          console.log("done", doneDate);

          let done = {
            check: true,
            date_time: doneDate,
          };
          // console.log(to_do);

          data.status.done = done;
          data.closure_date = doneDate;
          await data.save();
          result.push(`${ticketId} saved successfully`);
        } else {
          result.push(`${ticketId} already closed`);
        }
      }
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(404).json(error.message);
    console.log(`Error: ${error}`);
  }
}

async function getParticluarRequestDone() {
  try {
    let ticketId = "SR101122";
    let location = "NCR";

    let data = await Service_Request.findOne({
      ticket_id: ticketId,
    });

    if (!data) {
      console.log(data, ticketId);
      console.log({ message: "Ticket ID not found " + ticketId });
    } else {
      // console.log(ticketId);

      let doneStatus = data.status.done.check;
      if (doneStatus === false) {
        // console.log(ticketId, "Not Done", doneStatus);

        let inProgressDate = data.status.in_progress.date_time;
        if (!inProgressDate) {
          let toDoDate = data.status.to_do.date_time;

          inProgressDate = new Date(toDoDate.setHours(toDoDate.getHours() + 1));
          console.log(ticketId);
          console.log("todo", toDoDate);
          console.log("inProgress", inProgressDate);

          let in_progress = {
            check: true,
            date_time: inProgressDate,
          };
          // console.log(to_do);

          data.status.in_progress = in_progress;
          await data.save();
          // console.log("done", doneDate);
        }

        console.log("in_p", inProgressDate);

        let doneDate = new Date(
          inProgressDate.setHours(inProgressDate.getHours() + 1)
        );
        console.log("done", doneDate);
        /*
          let done = {
            check: true,
            date_time: doneDate,
          };
          // console.log(to_do);

          data.status.done = done;
          data.closure_date = doneDate;
          await data.save();
          console.log(`${ticketId} saved successfully`);  */
      }
    }
    console.log({
      message: `Service Requests Completed Successfully! Mail Sent to Manager`,
    });
  } catch (error) {
    console.log(`Error: ${error}`);
  }
}

function excelDateToJSDate(excelDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const daysFromExcelEpoch = excelDate - 25569; // Excel's epoch starts on January 1, 1900
  const dateInMilliseconds = daysFromExcelEpoch * millisecondsPerDay;
  const jsDate = new Date(dateInMilliseconds);
  return jsDate;
}

function formatDateToDDMMYYYY(date) {
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  let newDate = new Date(date);
  newDate.setHours(date.getHours() - 5, date.getMinutes() - 30);
  return newDate.toLocaleDateString("en-GB", options);
}

module.exports = {
  getRequestsDone,
  getParticluarRequestDone,
};
