const mongoose = require("mongoose");

const Email = mongoose.model(
  "Email",
  new mongoose.Schema({
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      validate: {
        validator: (v) => {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: (props) =>
          `${props.value} n'est pas une adresse email valide !`,
      },
    },
  })
);

module.exports = Email;
