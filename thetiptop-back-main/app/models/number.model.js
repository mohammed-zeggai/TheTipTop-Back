const mongoose = require("mongoose");

const Number = mongoose.model(
  "Number",
  new mongoose.Schema({
    number: {
      type: String,
    },
  })
);

module.exports = Number;
