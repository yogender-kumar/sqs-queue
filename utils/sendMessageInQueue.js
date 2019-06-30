const uniqid = require("uniqid");
const batchLimit = 10;

module.exports = (sqs, queueUrl, payload) => {
  const { contact_list, token, app_version_code, ...rest } = payload;
  let loopCount = Math.ceil(contact_list.length / batchLimit);
  const batch = [];

  while (true) {
    if (loopCount <= 0) {
      break;
    } else {
      batch.push({
        Id: `${uniqid()}`,
        DelaySeconds: 1,
        MessageBody: JSON.stringify({
          ...rest,
          contact_list: contact_list.splice(0, batchLimit)
        })
      });
      loopCount--;
    }
  }

  if (!batch.length) {
    return;
  }

  const params = {
    QueueUrl: queueUrl,
    Entries: batch
  };

  sqs.sendMessageBatch(params, (err, data) => {
    if (err) {
      console.log("ERRRRRRR::::", err);
    } else {
      // console.log("Message Sent::::::::::::::", data.MessageId);
      // receiveMessage(sqs, queueUrl);
    }
  });
};
