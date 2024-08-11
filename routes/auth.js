const router = require("express").Router();

const authController = require("../controllers/auth");

router.post("/api/login", authController.login);

router.post("/api/register", authController.register, authController.sendOTP);
router.post("/api/verify", authController.verifyOTP);
router.post("/api/send-otp", authController.sendOTP);

router.post("/api/forgot-password", authController.forgotPassword);
router.post("/api/reset-password", authController.resetPassword);

module.exports = router;
