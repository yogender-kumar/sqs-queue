// Require objects.
const express = require("express");
const app = express();
const aws = require("aws-sdk");
const fs = require('fs');
let queueUrl = "";
let receipt = "";

// Load your AWS credentials and try to instantiate the object.
aws.config.loadFromPath(__dirname + "/config.json");

// Instantiate SQS.
const sqs = new aws.SQS();

// Creating a queue.
app.get('/create', function (req, res) {
  const params = {
    QueueName: "MyFirstQueue"
  };

  sqs.createQueue(params, (err, data) => {
    if (err) {
        console.log(err);
        res.send(err);
    } else {
        console.log(data);
        res.send(data);
    }
  });
});

// Listing our queues.
app.get("/list", (req, res) => {
  sqs.listQueues((err, data) => {
    if (err) {
      res.send(err);
    } else {
      res.send(data);
    }
  });
});

// Sending a message.
// NOTE: Here we need to populate the queue url you want to send to.
// That variable is indicated at the top of app.js.
app.get("/send", (req, res) => {
  const params = {
    MessageBody: "Hello world!",
    QueueUrl: queueUrl,
    DelaySeconds: 0
  };

  sqs.sendMessage(params, (err, data) => {
    if (err) {
      res.send(err);
    } else {
      res.send(data);
    }
  });
});

// Receive a message.
// NOTE: This is a great long polling example. You would want to perform
// this action on some sort of job server so that you can process these
// records. In this example I'm just showing you how to make the call.
// It will then put the message "in flight" and I won't be able to
// reach that message again until that visibility timeout is done.
app.get("/receive", (req, res) => {
  const params = {
    QueueUrl: queueUrl,
    VisibilityTimeout: 600 // 10 min wait time for anyone else to process.
  };

  sqs.receiveMessage(params, (err, data) => {
    if (err) {
      res.send(err);
    } else {
      res.send(data);
    }
  });
});

// Deleting a message.
app.get("/delete", (req, res) => {
  const params = {
    QueueUrl: queueUrl,
    ReceiptHandle: receipt
  };

  sqs.deleteMessage(params, (err, data) => {
    if (err) {
      res.send(err);
    } else {
      res.send(data);
    }
  });
});

// Purging the entire queue.
app.get("/purge", (req, res) => {
  const params = {
    QueueUrl: queueUrl
  };

  sqs.purgeQueue(params, (err, data) => {
    if (err) {
      res.send(err);
    } else {
      res.send(data);
    }
  });
});

// Start server.
const server = app.listen(8080, () => {
  const host = server.address().address;
  const port = server.address().port;

  console.log("AWS SQS example app listening at http://%s:%s", host, port);
});
