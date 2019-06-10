const contacts = require("../models/contact");

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
      await contacts.create(
        contact_list.map(contact => {
          delete contact._id;
          return { ...contact, device_id };
        })
      );

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
