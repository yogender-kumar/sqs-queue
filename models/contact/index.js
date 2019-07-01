var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-1"
});

var dynamodb = new AWS.DynamoDB();

// dynamodb.createTable({ TableName: "Contacts" });

module.exports = {
  create: async data => {
    const params = {
      RequestItems: {
        Contacts: [...data]
      }
    };

    new Promise((resolve, reject) => {
      dynamodb.batchWriteItem(params, function(err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    const contactsList = promises
        .filter(result => !(result instanceof Error))
        .map(({ data: { ...rest } }) => ({
          PutRequest: {
            Item: {
              id: { S: uniqid() },
              [rest.user_id]: { S: JSON.stringify(rest) }
            }
          }
        }));

    // data.forEach(item => {
    //   const params = {
    //     TableName: "Contacts",
    //     Item: { ...item }
    //   };
    //   dynamodb.putItem(
    //     params,
    //     function(err, data) {
    //       err && console.log(err);
    //     }
    //   );
    // });
  }
};
