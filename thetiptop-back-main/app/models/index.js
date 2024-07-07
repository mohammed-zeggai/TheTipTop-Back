const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.gift = require("./gift.model");
db.user = require("./user.model");
db.ticket = require("./ticket.model");
db.number = require("./number.model");
db.email = require("./email.model");

module.exports = db;
