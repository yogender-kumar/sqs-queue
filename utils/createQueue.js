module.exports = (sqs, cb) => {
  const params = {
    QueueName: "Sagoon_Contact_Queue"
  };

  sqs.createQueue(params, (err, data) => {
    cb(err, data);
  });
};
