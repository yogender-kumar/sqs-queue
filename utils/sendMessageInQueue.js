const receiveMessage = require("./receiveMessage");

module.exports = (sqs, queueUrl, payload) => {
  const params = {
    MessageBody: payload,
    QueueUrl: queueUrl,
    DelaySeconds: 0
  };

  sqs.sendMessage(params, (err, data) => {
    if (err) {
      console.log("ERRRRRRR::::", err);
    } else {
      console.log("Message Sent::::::::::::::", data.MessageId);
      receiveMessage(sqs, queueUrl);
    }
  });
};
