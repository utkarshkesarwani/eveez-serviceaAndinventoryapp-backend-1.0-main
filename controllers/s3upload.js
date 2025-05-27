
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require("fs");

const region = process.env.REGION
const accessKeyId = process.env.ACCESSKEYID
const secretAccessKey = process.env.SECRETACCESSKEY
const bucketName = process.env.BUCKETNAME

const s3Client = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

// console.log(s3Client);

async function uploadImagesToS3(req, res) {
  try {
    console.log(req.body, req.files);
    let images = req.files
    let vehicle_no = req.body.vehicle_no

    const location = vehicle_no.slice(0, 3);

    const imageUrls = [];

    for (let i = 0; i < images.length; i++) {
      const imageName = `${Date.now()}-${vehicle_no}-${i+1}.png`;

      const params = {
        Bucket: bucketName,
        Key: `${location}/${imageName}`,
        ContentType: "image/png",
        Body: images[i].buffer,
      };

      const response = await s3Client.send(new PutObjectCommand(params));
      const imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${params.Key}`;

      console.log(imageUrl);
      imageUrls.push(imageUrl);
    }

    res.status(200).json({ imageUrls });
  } catch (error) {
    console.log(error);
      res.status(500).send(`Error: ${error}`);
  }
}

module.exports = {
  uploadImagesToS3,
};
