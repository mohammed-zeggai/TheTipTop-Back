const express = require("express");
const cors = require("cors");
const voucher_codes = require("voucher-code-generator");
require("dotenv").config({ path: `./.env.${process.env.NODE_ENV}` });

const app = express();

var corsOptions = {
  origin: ["http://localhost:3000", process.env.FRONT_END_URL],
};

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");
const Gift = db.gift;
const User = db.user;
const Number = db.number;
const Email = db.email;
db.mongoose
  .connect(
    `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      authSource: "admin",
    }
  )
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    loadFixtures();
  })
  .catch((err) => {
    console.error("Connection error", err);
    process.exit();
  });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to thetiptop backend application." });
});

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/ticket.routes")(app);
require("./app/routes/number.routes")(app);
require("./app/routes/email.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

function loadFixtures() {
  Gift.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      // Gifts fixtures
      const gifts = [
        new Gift({
          name: "Infuseur à thé",
          quota: 0.6,
        }),
        new Gift({
          name: "Boite de 100g d'un thé détox ou d’infusion",
          quota: 0.2,
        }),
        new Gift({
          name: "Boite de 100g d'un thé signature",
          quota: 0.1,
        }),
        new Gift({
          name: "Coffret découverte d’une valeur de 39€",
          quota: 0.06,
        }),
        new Gift({
          name: "Coffret découverte d’une valeur de 69€",
          quota: 0.04,
        }),
        new Gift({
          name: "Un an de thé d’une valeur de 360€",
          quota: 0,
          isSpecial: true,
        }),
      ];

      Gift.collection
        .insertMany(gifts)
        .then(() => {
          console.log("gifts inserted successfully");
        })
        .catch((e) => {
          console.log("error", e);
        });

      // Users fixtures

      const users = [
        {
          email: "admin@thetiptop.com",
          password:
            "$2y$10$CuilIekJNRU7piXEOfhOv.dt/0qB0xKsSlQaMB4oBFcsE6wgJMAfK", // password
          name: "Mohammed ZEGGAI",
          access_level: 1,
          is_sso: false,
        },
        {
          email: "staff@thetiptop.com",
          password:
            "$2y$10$CuilIekJNRU7piXEOfhOv.dt/0qB0xKsSlQaMB4oBFcsE6wgJMAfK", // password
          name: "Reda ZAHRAOUI",
          access_level: 2,
          is_sso: false,
        },
        {
          email: "client@thetiptop.com",
          password:
            "$2y$10$CuilIekJNRU7piXEOfhOv.dt/0qB0xKsSlQaMB4oBFcsE6wgJMAfK", // password
          name: "Badr NHAMMOUCHA",
          access_level: 3,
          is_sso: false,
        },
      ];

      User.collection
        .insertMany(users)
        .then(() => {
          console.log("users inserted successfully");
        })
        .catch((e) => {
          console.log("error", e);
        });
      let voucher = voucher_codes.generate({
        length: 10,
        count: process.env.TOTAL_TICKETS,
        charset: "0123456789",
      });

      const docs = voucher.map((number) => {
        return { number: number };
      });
      // console.log(docs);
      Number.collection
        .insertMany(docs)
        .then(() => {
          console.log("numbers inserted successfully");
        })
        .catch((e) => {
          console.log("error", e);
        });
    }
  });
}
