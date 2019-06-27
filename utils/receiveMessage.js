const contacts = require("../models/contact");

const axios = require("axios");

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
      // console.log(err);
    } else {
      if (!res || !res.Messages) {
        return;
      }
      const { Body, ReceiptHandle, MessageId } = res.Messages[0];
      // console.log("Message Received::::::::", ReceiptHandle);

      const { contact_list, ...rest } = JSON.parse(Body);

      const promises = await Promise.all(
        contact_list.map(contact => {
          const payload = {
            ...contact,
            ...rest
          };

          return axios
            .post(
              `https://dev.sagoon.com/MobileNumber/phoneNumberStatus`,
              payload
            )
            .catch(err => err);
        })
      );

      const contactsList = promises
        .filter(result => !(result instanceof Error))
        .map(({ data: { _id, ...rest } }) => rest);

      await contacts.create(contactsList);

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
