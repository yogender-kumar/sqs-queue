// Require objects.
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const aws = require("aws-sdk");
const mongoose = require("mongoose");
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

// Instantiate SQS.
const sqs = new aws.SQS();

// Creating a queue.
app.post("/create", (req, res) => {
  const payload = req.body;
  createQueue(sqs, (err, data) => {
    if (err) {
      res.send(err);
    } else {
      res.send(data);

      //   payload.contact_list.forEach((contact) => {
      // sendMessage(sqs, data.QueueUrl, JSON.stringify({...contact, device_id: payload.device_id}));
      //   });

      sendMessage(sqs, data.QueueUrl, JSON.stringify(payload));
    //   receiveMessage(sqs, data.QueueUrl);
    }
  });
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
