const jwt = require("jsonwebtoken");
const db = require("../models");
const dotenv = require("dotenv").config();
const User = db.user;

verifyToken = (req, res, next) => {
  let token = req.headers[process.env.JWT_HEADER];

  if (!token) {
    return res.status(401).send({
      message: "Clé d'authentification non fournie",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        error: err,
        message: "Clé d'authentification non valide",
      });
    }
    req.userId = decoded.id;
    req.email = decoded.email;
    req.access_level = decoded.access_level;
    next();
  });
};

isClient = (req, res, next) => {
  if (req.access_level != process.env.CLIENT_ACCESS_LEVEL) {
    res.status(403).send({
      message: "Accès refusé",
    });

    return;
  }

  next();
};

isAdmin = (req, res, next) => {
  if (req.access_level != 1) {
    res.status(403).send({
      message: "Accès refusé",
    });

    return;
  }

  next();
};

isModerator = (req, res, next) => {
  if (req.access_level != 2) {
    res.status(403).send({
      message: "Accès refusé",
    });

    return;
  }

  next();
};

const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
  isClient,
};
module.exports = authJwt;
