module.exports = (sqs, queueUrl) => {
  const params = {
    QueueUrl: queueUrl
  };

  sqs.purgeQueue(params, (err, data) => {

    console.log(err, '==========', data);
  });
};
