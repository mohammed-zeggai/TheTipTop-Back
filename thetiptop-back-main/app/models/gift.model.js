const mongoose = require("mongoose");

const Gift = mongoose.model(
  "Gift",
  new mongoose.Schema({
    name: String,
    quota: Number,
    given: {
      type: Number,
      default: 0,
    },
    isSpecial: {
      type: Boolean,
      default: false,
    },
  })
);

module.exports = Gift;
