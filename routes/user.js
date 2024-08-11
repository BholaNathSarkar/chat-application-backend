const router = require("express").Router();

const userController = require("../controllers/user");
const authController = require("../controllers/auth");

router.patch("/api/update-me", authController.protect, userController.updateMe);

router.get("/api/get-users", authController.protect, userController.getUsers);
router.get(
  "/api/get-friends",
  authController.protect,
  userController.getFriends
);
router.get(
  "/api/get-friends-request",
  authController.protect,
  userController.getRequests
);

module.exports = router;
