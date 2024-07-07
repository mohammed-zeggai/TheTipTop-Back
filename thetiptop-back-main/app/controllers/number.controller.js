const mongoose = require("mongoose");
const db = require("../models");
const dotenv = require("dotenv").config();
const Number = db.number;

exports.listNumbers = async (req, res) => {
  const allNumbers = await Number.find();
  res.status(200).send({
    allNumbers,
  });
};
