const { authJwt } = require("../middlewares");
const controller = require("../controllers/ticket.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/api/tickets",
    [authJwt.verifyToken, authJwt.isClient],
    controller.participate
  );

  app.post(
    "/api/verifyticket",
    [authJwt.verifyToken, authJwt.isClient],
    controller.verify
  );

  app.get(
    "/api/admin/tickets",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.list
  );

  app.get(
    "/api/tickets",
    [authJwt.verifyToken, authJwt.isClient],
    controller.list
  );

  app.post(
    "/api/staff/tickets",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.listUserTickets
  );

  app.get(
    "/api/staff/confirm/:id",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.confirm
  );

  app.get(
    "/api/admin/win",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.grandPrize
  );

  // app.put(
  //   "/api/admin/update",
  //   [authJwt.verifyToken, authJwt.isAdmin],
  //   controller.updateState
  // );

  app.get(
    "/api/admin/numbers",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.listNumbers
  );

  app.get("/api/dates", controller.sendDates);
};
