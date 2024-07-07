const mongoose = require("mongoose");
const db = require("../models");
const dotenv = require("dotenv").config();
const Ticket = db.ticket;
const Gift = db.gift;
const User = db.user;
const Number = db.number;

const isValidEmail = (email) => {
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
};

exports.list = async (req, res) => {
  const totalGiven = await Gift.aggregate([
    { $match: {} },
    { $group: { _id: null, totalGiven: { $sum: "$given" } } },
  ]);

  const criteria = req.access_level === 1 ? {} : { client: req.userId };

  const allTickets = await Ticket.find(criteria)
    .populate({ path: "client", select: ["name", "email"] })
    .populate({ path: "gift" });

  res.status(200).send({
    gifts_won: totalGiven[0].totalGiven,
    gifts_left: process.env.TOTAL_TICKETS - totalGiven[0].totalGiven,
    tickets: allTickets,
  });
};

exports.listUserTickets = async (req, res) => {
  if (!req.body || !isValidEmail(req.body.email)) {
    res.status(400).send({
      message: "L'email saisi n'est pas valide",
    });

    return;
  }

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    res.status(404).send({
      message: "Aucun compte associé à cet adresse email n'a été trouvé",
    });

    return;
  }

  const userTickets = await Ticket.find({
    client: user._id,
  })
    .populate({ path: "client", select: ["name", "email"] })
    .populate({ path: "gift" });

  res.status(200).send({
    length: userTickets.length,
    tickets: userTickets,
  });
};

exports.confirm = async (req, res) => {
  const ticket = await Ticket.findById(mongoose.Types.ObjectId(req.params.id));
  if (!ticket) {
    res.status(404).send({
      message: "Ticket introuvable",
    });

    return;
  }

  if (ticket.received) {
    res.status(422).send({
      message: "Cadeau déjà remis",
    });

    return;
  }

  ticket.received = true;
  ticket.delivered_by = req.userId;
  ticket.reception_date = new Date();

  ticket
    .save()
    .then(() => {
      res.status(200).send({
        message: "Cadeau remis avec succès",
      });
    })
    .catch((err) => {
      res.status(500).send({
        err: err,
      });
    });
};

exports.participate = async (req, res) => {
  const error = await new Ticket({ number: req.body.number }).validateSync();

  if (error && error.errors) {
    res.status(400).send({
      message: "Le formulaire contient des erreurs",
      errors: error.errors,
    });

    return;
  }

  Ticket.findOne({ number: req.body.number }).exec((err, ticket) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (ticket) {
      res.status(422).send({
        message: "Le numéro saisi n'est plus valide",
      });

      return;
    }

    // Pre checks before allowing new ticket/award generation

    if (
      process.env.CONTEST_START_TIMESTAMP + process.env.CONTEST_DURATION <
      Math.floor(new Date().getTime() / 1000)
    ) {
      res.status(422).send({
        message: "Le concours est terminé",
      });

      return;
    }

    Number.findOne({ number: req.body.number }).exec((err, winNumber) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }
      if (!winNumber) {
        res.status(404).send({
          message: "Le numéro saisi est invalide",
        });

        return;
      }

      Gift.find().exec((err, gifts) => {
        if (err || !gifts) {
          res.status(500).send({ message: err });
          return;
        }

        let totalGiven = 0;

        gifts.forEach((gift) => {
          totalGiven += gift.given;
        });

        if (totalGiven >= process.env.TOTAL_TICKETS) {
          res.status(422).send({
            message: "Il n'est plus possible de participer au concours",
          });

          return;
        }

        // Generating new award

        const available_gifts = [...gifts].filter((e) => {
          return process.env.TOTAL_TICKETS * e.quota > e.given;
        });

        if (!available_gifts.length) {
          return false;
        }

        const randGiftIndex = Math.floor(
          Math.random() * available_gifts.length
        );

        const chosenGift = available_gifts[randGiftIndex];

        chosenGift.given++;

        chosenGift.save();

        const ticket = new Ticket({
          number: req.body.number,
          client: req.userId,
          gift: chosenGift._id,
        });

        ticket
          .save()
          .then(() => {
            res.status(201).send({
              message: "Félicitation ! Vous avez gagné",
              gift: chosenGift.name,
            });
          })
          .catch((err) => {
            res.status(500).send({ message: err });
          });
      });
    });
  });
};

// exports.updateState = async (req, res) => {
//   const newNumberState = Number.findOne({ number: req.body.number });
//   Object.assign(newNumberState, true);
//   newNumberState.isUsed = true;
//   newNumberState.save();
// };

exports.grandPrize = async (req, res) => {
  const specialTickets = await Gift.aggregate([
    { $match: { isSpecial: true } },
    {
      $lookup: {
        from: Ticket.collection.name,
        let: { giftId: "$_id" },
        as: "tickets",
        pipeline: [{ $match: { $expr: { $eq: ["$gift", "$$giftId"] } } }],
      },
    },

    { $unwind: "$tickets" },
    { $replaceRoot: { newRoot: "$tickets" } },
  ]);

  if (specialTickets.length) {
    res.status(422).send({
      message: "Le cadeau spécial a déjà été attribué",
    });
    return;
  }

  const allParticipants = await Ticket.find({}, { client: 1 }).distinct(
    "client"
  );
  const winnerIndex = Math.floor(Math.random() * allParticipants.length);
  const winner = await User.findById(
    mongoose.Types.ObjectId(allParticipants[winnerIndex])
  );
  const specialGift = await Gift.findOne({ isSpecial: true });
  const ticket = new Ticket({
    number: null,
    client: winner,
    gift: mongoose.Types.ObjectId(specialGift._id),
  });

  ticket
    .save({ validateBeforeSave: false })
    .then(() => {
      res.status(201).send({
        message: "Le gagnant au tomobola a été choisi",
        client: {
          id: winner._id,
          name: winner.name,
          email: winner.email,
        },
        gift: specialGift,
      });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

exports.listNumbers = async (req, res) => {
  const allNumbers = await Number.find().select("number");
  const allUsedNumbers = await Ticket.find().select("number");
  const list = allNumbers.map((number) => {
    return {
      number: number.number,
      isUsed:
        allUsedNumbers.findIndex((e) => e.number === number.number) !== -1,
    };
  });
  res.status(200).send({ list });
};

exports.verify = async (req, res) => {
  const error = await new Ticket({ number: req.body.number }).validateSync();

  if (error && error.errors) {
    res.status(400).send({
      message: "Le formulaire contient des erreurs",
      errors: error.errors,
    });

    return;
  }

  Ticket.findOne({ number: req.body.number }).exec((err, ticket) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (ticket) {
      res.status(422).send({
        message: "Le numéro saisi n'est plus valide",
      });

      return;
    }

    // Pre checks before allowing new ticket/award generation

    if (
      process.env.CONTEST_START_TIMESTAMP + process.env.CONTEST_DURATION <
      Math.floor(new Date().getTime() / 1000)
    ) {
      res.status(422).send({
        message: "Le concours est terminé",
      });

      return;
    }

    Number.findOne({ number: req.body.number }).exec((err, winNumber) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }
      if (!winNumber) {
        res.status(404).send({
          message: "Le numéro saisi est invalide",
        });

        return;
      }

      Gift.find().exec((err, gifts) => {
        if (err || !gifts) {
          res.status(500).send({ message: err });
          return;
        }

        let totalGiven = 0;

        gifts.forEach((gift) => {
          totalGiven += gift.given;
        });

        if (totalGiven >= process.env.TOTAL_TICKETS) {
          res.status(422).send({
            message: "Il n'est plus possible de participer au concours",
          });

          return;
        }
      });
    });
  });
};

exports.sendDates = async (req, res) => {
  const start = process.env.CONTEST_START_TIMESTAMP;
  const duration = process.env.CONTEST_DURATION;
  res.status(200).send({
    start: start,
    duration: duration,
  });
};
