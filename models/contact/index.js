const aws = require("aws-sdk");

aws.config.region = "us-west-1";

var dynamodb = new aws.DynamoDB();

dynamodb.createTable(
  {
    TableName: "Contacts",
    KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  (err, res) => {
    if (err && err.code !== "ResourceInUseException") {
      console.log(err);
      process.exit(1);
    }
  }
);

module.exports = {
  create: async data => {
    const params = {
      RequestItems: {
        Contacts: [...data]
      }
    };

    return await new Promise((resolve, reject) => {
      dynamodb.batchWriteItem(params, function(err, data) {
        if (err) {
          console.log(err);
          reject(err.message);
        } else {
          resolve(data);
        }
      });
    }).catch(err => console.log(err));
  }
};
