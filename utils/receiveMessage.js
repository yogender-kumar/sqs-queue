const contacts = require("../models/contact");

const axios = require("axios");
const uniqid = require("uniqid");

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

          return axios
            .post(
              `https://dev.sagoon.com/MobileNumber/phoneNumberStatus`,
              payload
            )
            .catch(err => err);
        })
      );

      // const contactsList = promises
      //   .filter(result => !(result instanceof Error))
      //   .map(({ data: { ...rest } }) => ({
      //     PutRequest: {
      //       Item: {
      //         id: { S: uniqid() },
      //         [rest.user_id]: { S: JSON.stringify(rest) }
      //       }
      //     }
      //   }));

      // const dta = [
      //   {
      //     status: 1,
      //     message: "Success",
      //     mobile: 9999114063,
      //     std_code: 91,
      //     country_id: 100,
      //     in_sagoon: false,
      //     number_type: 1,
      //     reason: "",
      //     valid: true
      //   },
      //   {
      //     status: 1,
      //     message: "Success",
      //     mobile: 8888888888,
      //     std_code: 91,
      //     country_id: 100,
      //     in_sagoon: true,
      //     number_type: 1,
      //     reason: "",
      //     valid: true
      //   }
      // ];

      // const dummyJson = dta.map(dt => {
      //   return {
      //     id: { S: uniqid() },
      //     [rest.user_id]: { S: JSON.stringify({ ...dt, ...rest }) }
      //   };
      // });

      /**
       * This code is used for single process for each record in dynamoDB
       */

      // const contactsList = promises
      //   .filter(result => {
      //     if(!(result instanceof Error) || typeof result.data === 'string'){
      //       return false;
      //     }
      //     return true;
      //   })
      //   .map(({ data: { ...r } }) => {
      //     return {
      //       id: { S: uniqid() },
      //       userId: { S: rest.user_id},
      //       [rest.user_id]: { S: JSON.stringify({ ...r, ...rest }) }
      //     };
      //   });

      /**
       * This code is used for batch process in dynamoDB
       */
      const contactsList = promises
        .filter(result => {
          if (!(result instanceof Error) || typeof result.data === "string") {
            return false;
          }
          return true;
        })
        .map(({ data: { ...r } }) => ({
          PutRequest: {
            Item: {
              id: { S: uniqid() },
              [rest.user_id]: { S: JSON.stringify({ ...r, ...rest }) }
            }
          }
        }));

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
