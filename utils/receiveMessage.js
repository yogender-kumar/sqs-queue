const contacts = require("../models/contact");

const axios = require("axios");
const uniqid = require("uniqid");

const CONSTANTS = require("../constants");

const checkNumber = (data, count, device_id) => {
  if (data.length <= count) {
    return data;
  }
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

      const { contact_list, ...rest } = JSON.parse(Body);

      const promises = await Promise.all(
        contact_list.map(contact => {
          const payload = {
            ...contact,
            ...rest
          };

          return axios.post(`${CONSTANTS.API.URL}`, payload).catch(err => err);
        })
      );

      /**
       * This code is used for batch process in dynamoDB
       */
      const contactsList = promises
        .filter(result => {
          if (result instanceof Error || typeof result.data === "string") {
            return false;
          }
          return true;
        })
        .map(({ data: { ...r } }) => {
          return {
            // PutRequest: {
            //   Item: {
            //     id: { S: uniqid() },
            //     [rest.user_id]: { S: JSON.stringify({ ...r, ...rest }) }
            //   }
            // }
            Item: {
              id: { S: uniqid() },
              [rest.user_id]: { S: JSON.stringify({ ...r, ...rest }) }
            }
          };
        });
        
      if (contactsList.length) {
        await contacts.create(contactsList);
      }

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
