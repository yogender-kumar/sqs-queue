// Require objects.
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const aws = require("aws-sdk");
const jwt = require("jsonwebtoken");

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb", extended: true }));

const createQueue = require("./utils/createQueue");
const sendMessage = require("./utils/sendMessageInQueue");
const receiveMessage = require("./utils/receiveMessage");
const purgQueue = require("./utils/purge");

// Load your AWS credentials and try to instantiate the object.
aws.config.loadFromPath(__dirname + "/config.json");

const jwtErrorResponse = {
  status: 2,
  message: "Unauthorize Access",
  errors: "Token is not valid for this user."
};

// Instantiate SQS.
const sqs = new aws.SQS();

const queueObj = {
  QueueUrl: "",
  err: ""
};

createQueue(sqs, (err, data) => {
  if (err) {
    queueObj.err = err;
  } else {
    queueObj.QueueUrl = data.QueueUrl;
    setInterval(() => {
      receiveMessage(sqs, data.QueueUrl);
    }, 5000);
  }
});

// Creating a queue.
app.post("/create", (req, res) => {
  const deviceId = req.headers["device-id"];
  if (req.body.token && deviceId) {
    const token = req.body.token;

    try {
      var decoded = jwt.verify(token, "AZWEC854ZXM052");

      if (decoded.deviceID.toString() === deviceId.toString()) {
        const payload = req.body;
        payload.device_id = decoded.deviceID;
        payload.user_id = decoded.uid;
        payload.country_code = req.headers["country-code"];
        if (queueObj.err) {
          res.send(queueObj.err);
        } else {
          res.json({
            status: 1,
            message: "Success",
            queueUrl: queueObj.QueueUrl
          });
          sendMessage(sqs, queueObj.QueueUrl, payload);
        }
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
  res.send({ status: "SUCCESS" });
  purgQueue(sqs, queueObj.QueueUrl);
});

// Start server.
const server = app.listen(8080, () => {
  const host = server.address().address;
  const port = server.address().port;

  console.log("AWS SQS example app listening at http://%s:%s", host, port);
});
