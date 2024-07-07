const { verifySignUp, authJwt } = require("../middlewares");
const controller = require("../controllers/auth.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/api/auth/signup",
    [verifySignUp.checkDuplicateEmail],
    controller.signup
  );

  app.post(
    "/api/admin/signup",
    [verifySignUp.checkDuplicateEmail, authJwt.verifyToken, authJwt.isAdmin],
    controller.advancedSignup
  );

  app.post("/api/auth/signin", controller.signin);
  app.post(
    "/api/auth/delete",
    [authJwt.verifyToken, authJwt.isClient],
    controller.deleteUser
  );

  app.patch(
    "/api/auth/updateuser",
    [authJwt.verifyToken],
    controller.modifyUser
  );

  app.post("/api/auth/sso", controller.ssoLogin);

  app.post("/api/auth/ssofb", controller.ssoLoginFacebook);

  app.get(
    "/api/admin/emails",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.listAllEmails
  );
};
