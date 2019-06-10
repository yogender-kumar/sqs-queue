module.exports = (sqs, cb) => {
  const params = {
    QueueName: "TestQueueFirst"
  };

  sqs.createQueue(params, (err, data) => {
    cb(err, data);
  });
};
