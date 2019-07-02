module.exports = (sqs, cb) => {
  const params = {
    QueueName: "Sagoon_Contact_Queue_1"
  };

  sqs.createQueue(params, (err, data) => {
    cb(err, data);
  });
};
