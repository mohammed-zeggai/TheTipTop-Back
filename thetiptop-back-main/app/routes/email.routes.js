const { authJwt } = require("../middlewares");
const controller = require("../controllers/email.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/api/addemail", controller.addNewsletter);

  app.get(
    "/api/admin/newsletteremails",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.listNewsletterEmails
  );
};
