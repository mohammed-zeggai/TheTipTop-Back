const db = require("../models");
const Email = db.email;
const jwt = require("jsonwebtoken");

exports.addNewsletter = async (req, res) => {
  const email = await new Email({
    email: req.body.email,
  });
  const error = email.validateSync();

  if (error && error.errors) {
    res.status(400).send({
      message: "Le formulaire contient des erreurs",
      errors: error.errors,
    });

    return;
  }

  Email.findOne({ email: req.body.email }).exec((err, foundEmail) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (foundEmail) {
      res.status(422).send({
        message: "L'email saisi est déjà abonné à la newsletter",
      });

      return;
    }

    if (!foundEmail) {
      email.save().then(
        () => {
          res.status(201).send({
            message: "Email ajouté à la liste des newsletter avec succès",
          });
        },
        (err) => {
          res.status(500).send({ message: err });
        }
      );
    }
  });
};

exports.listNewsletterEmails = async (req, res) => {
  const newsletterEmails = await Email.find().select(["email"]);
  if (!newsletterEmails) {
    res.status(402).send({
      message: "Aucun email n'est enregistré",
    });
    return;
  }
  res.status(200).send({
    emails: newsletterEmails,
  });
};
