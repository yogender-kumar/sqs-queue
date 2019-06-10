const mongoose = require("mongoose");

const contact = new mongoose.Schema({
  device_id: {
    type: String
  },
  device_contact_id: {
    type: String
  },
  first_name: {
    type: String
  },
  raw_input: {
    type: String
  },
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  }
});
module.exports = mongoose.model("Contacts", contact, "Contacts");
