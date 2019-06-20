// Require objects.
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const aws = require("aws-sdk");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
// const fs = require("fs");

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb", extended: true }));

const createQueue = require("./utils/createQueue");
// const receiveMessage = require("./utils/receiveMessage");
const sendMessage = require("./utils/sendMessageInQueue");
const purgQueue = require("./utils/purge");
const { DB } = require("./constants");

// Load your AWS credentials and try to instantiate the object.
aws.config.loadFromPath(__dirname + "/config.json");

const jwtErrorResponse = {
  status: 2,
  message: "Unauthorize Access",
  errors: "Token is not valid for this user."
};

// Instantiate SQS.
const sqs = new aws.SQS();

// app.post("/test", (req, res) => {
//   // console.log("Body::::::", req.body);
//   console.log("Headers::::::::::", req.headers["device-id"]);
//   const deviceId = req.headers["device-id"];
//   const authorization = req.headers["authorization"];

//   if (authorization && deviceId) {
//     const bearer = authorization.split(" ");
//     const token = bearer[1];

//     try {
//       var decoded = jwt.verify(token, "AZWEC854ZXM052");
//       console.log(decoded);
//       if (decoded.deviceId === deviceId) {
//         res.json(decoded);
//       } else {
//         res.json(jwtErrorResponse);
//       }
//     } catch (err) {
//       res.json(jwtErrorResponse);
//     }
//   } else {
//     res.json(jwtErrorResponse);
//     // res.sendStatus(403);
//   }
// });

// Creating a queue.
app.post("/create", (req, res) => {
  const deviceId = req.headers["device-id"];
  const authorization = req.headers["authorization"];

  if (authorization && deviceId) {
    const bearer = authorization.split(" ");
    const token = bearer[1];

    try {
      var decoded = jwt.verify(token, "AZWEC854ZXM052");
      if (decoded.deviceId === deviceId) {

        const payload = req.body;
        payload.token = token;
        payload.device_id = decoded.deviceId;
        
        createQueue(sqs, (err, data) => {
          if (err) {
            res.send(err);
          } else {
            res.send(data);
            sendMessage(sqs, data.QueueUrl, JSON.stringify(payload));
          }
        });
      } else {
        res.json(jwtErrorResponse);
      }
    } catch (err) {
      res.json(jwtErrorResponse);
    }
  } else {
    res.json(jwtErrorResponse);
  }
});

app.get("/empty", (req, res) => {
  createQueue(sqs, (err, data) => {
    if (err) {
      res.send(err);
    } else {
      res.send(data);
      purgQueue(sqs, data.QueueUrl);
    }
  });
});

// Start server.

mongoose.connect(`${DB.PROTOCOL}${DB.DOMAIN}${DB.PORT}/${DB.DATABASE}`, err => {
  if (err) {
    console.log("DB connection Error");
    process.exit(1);
  } else {
    const server = app.listen(8080, () => {
      const host = server.address().address;
      const port = server.address().port;

      console.log("AWS SQS example app listening at http://%s:%s", host, port);
    });
  }
});
