const AWS = require("aws-sdk");
AWS.config.update({ region: "YOUR_REGION" });

async function sendMail() {
  const ses = new AWS.SES();

  const params = {
    Destination: {
      ToAddresses: ["recipient@example.com"],
    },
    Message: {
      Body: {
        Html: {
          Data: "<p>Hello!</p>",
        },
      },
      Subject: {
        Data: "Test email",
      },
    },
    Source: "sender@example.com",
  };

  ses.sendEmail(params, (err, data) => {
    if (err) console.log(err, err.stack);
    else console.log("Email sent:", data);
  });
}
