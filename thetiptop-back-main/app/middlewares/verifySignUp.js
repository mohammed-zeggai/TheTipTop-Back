const db = require("../models");
const User = db.user;

checkDuplicateEmail = (req, res, next) => {
  // Username
  User.findOne({
    email: req.body.email
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (user) {
      res.status(422).send({ message: "Cette adresse email est déjà utilisée." });
      return;
    }

    next();
  });
};

const verifySignUp = {
  checkDuplicateEmail
};

module.exports = verifySignUp;
