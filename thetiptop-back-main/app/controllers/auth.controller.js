const db = require("../models");
const User = db.user;
const dotenv = require("dotenv").config();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const axios = require("axios");

exports.signup = (req, res) => {
  const user = new User({
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
    access_level: process.env.CLIENT_ACCESS_LEVEL,
  });

  const error = user.validateSync();

  if (error && error.errors) {
    res.status(400).send({
      message: "Le formulaire contient des erreurs",
      errors: error.errors,
    });

    return;
  }

  user.password = bcrypt.hashSync(req.body.password, 8);

  user.save().then(
    () => {
      res.status(201).send({
        email: user.email,
        name: user.name,
        access_level: user.access_level,
      });
    },
    (err) => {
      res.status(500).send({ message: err });
    }
  );
};

exports.advancedSignup = (req, res) => {
  const user = new User({
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
    access_level: req.body.access_level,
  });

  const error = user.validateSync();

  if (error && error.errors) {
    res.status(400).send({
      message: "Le formulaire contient des erreurs",
      errors: error.errors,
    });

    return;
  }

  user.password = bcrypt.hashSync(req.body.password, 8);

  user.save().then(
    () => {
      res.status(201).send({
        email: user.email,
        name: user.name,
        access_level: user.access_level,
      });
    },
    (err) => {
      res.status(500).send({ message: err });
    }
  );
};

exports.signin = (req, res) => {
  User.findOne({
    email: req.body.email,
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (!user) {
      return res.status(401).send({
        message: "L'email et/ou le mot de passe saisi est incorrecte",
      });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        message: "L'email et/ou le mot de passe saisi est incorrecte",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.name,
        access_level: user.access_level,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRATION, // 24 hours
      }
    );

    res.status(200).send({
      id: user._id,
      email: user.email,
      name: user.name,
      access_level: user.access_level,
      token,
    });
  });
};

exports.ssoLogin = (req, res) => {
  User.findOne({
    email: req.body.email,
  }).exec(async (err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (user && !user.is_sso) {
      return res.status(401).send({
        message:
          "Un compte classsique associé à cette adresse email existe déjà",
      });
    }

    (async () => {
      try {
        await axios
          .get(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${req.body.access_token}`,
            {
              headers: {
                "Content-Type": "application/json",
                "Accept-Encoding": "application/json",
              },
            }
          )
          .then(async (ssoResponse) => {
            if (req.body.email !== ssoResponse.data.email) {
              return res.status(401).send({
                message: `L'email fourni ne correspond pas à la clé d'authentification.`,
              });
            }

            if (!user) {
              const newUser = new User({
                email: ssoResponse.data.email,
                name: ssoResponse.data.name,
                access_level: process.env.CLIENT_ACCESS_LEVEL,
                password: Math.random().toString(8),
                is_sso: true,
              });

              await newUser.save().then(
                () => {
                  const token = this.signToken(newUser);

                  return res.status(201).send({
                    id: newUser._id,
                    email: newUser.email,
                    name: newUser.name,
                    access_level: newUser.access_level,
                    token,
                  });
                },
                (err) => {
                  return res.status(500).send({ message: err });
                }
              );
            } else {
              const token = this.signToken(user);

              return res.status(200).send({
                id: user._id,
                email: user.email,
                name: user.name,
                access_level: user.access_level,
                token,
              });
            }
          })
          .catch((error) => {
            return res
              .status(JSON.parse(JSON.stringify(error)).status)
              .send({ message: "error", data: error });
          });
      } catch (error) {
        return res.status(500).send({ message: "error", data: error });
      }
    })();
  });
};

exports.ssoLoginFacebook = (req, res) => {
  (async () => {
    try {
      await axios
        .get(
          `https://graph.facebook.com/v9.0/me?access_token=${req.body.access_token}&fields=name,email,picture&method=get&pretty=0&sdk=joey&suppress_http_code=1`
        )
        .then(async (ssoResponse) => {
          User.findOne({
            email: ssoResponse.data.email,
          }).exec(async (err, user) => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }
            if (user && !user.is_sso) {
              return res.status(401).send({
                message:
                  "Un compte associé à cette adresse email existe déjà",
              });
            }
            if (!user) {
              const newUser = new User({
                email: ssoResponse.data.email,
                name: ssoResponse.data.name,
                access_level: process.env.CLIENT_ACCESS_LEVEL,
                password: Math.random().toString(8),
                is_sso: true,
              });
              await newUser.save().then(
                () => {
                  const token = this.signToken(newUser);

                  return res.status(201).send({
                    id: newUser._id,
                    email: newUser.email,
                    name: newUser.name,
                    access_level: newUser.access_level,
                    token,
                  });
                },
                (err) => {
                  return res.status(500).send({ message: err });
                }
              );
            } else {
              const token = this.signToken(user);

              return res.status(200).send({
                id: user._id,
                email: user.email,
                name: user.name,
                access_level: user.access_level,
                token,
              });
            }
          });
        })
        .catch((error) => {
          return res
            .status(JSON.parse(JSON.stringify(error)).status)
            .send({ message: "error", data: error });
        });
    } catch (error) {
      return res.status(500).send({ message: "error", data: error });
    }
  })();
};

exports.signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      access_level: user.access_level,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRATION,
    }
  );
};

exports.listAllEmails = async (req, res) => {
  const allEmails = await User.find({ access_level: 3 }).select([
    "name",
    "email",
  ]);
  if (!allEmails) {
    res.status(402).send({
      message: "Aucun email n'est enregistré",
    });
    return;
  }
  res.status(200).send({
    emails: allEmails,
  });
};

exports.modifyUser = async (req, res) => {
  await User.findOne({ email: req.body.email }).then(async (user, err) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    if (!user) {
      return res.status(401).send({
        message: "L'email et/ou le mot de passe saisi est incorrecte",
      });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.oldPassword,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        message: "Le mot de passe saisi est incorrecte",
      });
    }

    const newPassword = bcrypt.hashSync(req.body.newPassword, 8);

    user.password = newPassword;
    await user.save();
    return res.status(200).send({
      id: user._id,
      email: user.email,
      name: user.name,
      access_level: user.access_level,
    });
  });
};

exports.deleteUser = async (req, res) => {
  const token = req.headers[process.env.JWT_HEADER];
  const data = jwt.decode(token);
  await User.findOne({ email: data.email }).then(async (user, err) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    if (!user) {
      return res.status(401).send({
        message: "L'email est incorrecte",
      });
    }
    user.name = "Utilisateur supprimé";
    user.email = "deleted@user.com";
    user.password = Math.random().toString(8);

    await user.save();
    return res.status(200).send({
      message: "Votre compte a été supprimé",
    });
  });
};
