const contacts = require("../models/contact");

const axios = require('axios')

const checkNumber = (data, count, device_id) => {
  if (data.length <= count) {
    return data;
  }

  delete data[count]._id;
  data[count].device_id = device_id;

  return checkNumber(data, count, device_id);
};

module.exports = (sqs, queueUrl) => {
  const params = {
    QueueUrl: queueUrl,
    VisibilityTimeout: 120 // 2 min wait time for anyone else to process.
  };

  sqs.receiveMessage(params, async (err, res) => {
    if (err) {
      console.log(err);
    } else {
      const { Body, ReceiptHandle, MessageId } = res.Messages[0];
      console.log("Message Received::::::::", MessageId);

      const { device_id, contact_list } = JSON.parse(Body);
        const d = await contact_list.map(async contact => {
          delete contact._id;
          const res = await axios.get(`https://api.sagoon.com/MobileNumber/mobileNumberStatus/${contact.raw_input}/IN`).then((result) => result);
          await contacts.create({ ...contact, in_sagoon: res.data.in_sagoon, device_id });
        });

      var deleteParams = {
        QueueUrl: queueUrl,
        ReceiptHandle: ReceiptHandle
      };
      sqs.deleteMessage(deleteParams, (err, data) => {
        if (err) {
          console.log("Delete Error", err);
        } else {
          console.log("Message Deleted", data);
        }
      });
    }
  });
};
