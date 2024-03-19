const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");

//
const User = require("../models/user");
const filterObj = require("../utils/filterObj");

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);

// register New user
exports.register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  const filterBody = filterObj(
    req.body,
    "firstName",
    "lastName",
    "email",
    "password"
  );

  // check if a varified user with given email exists.
  const existing_user = await User.findOne({ email: email });
  if (existing_user && existing_user.verified) {
    res.status(400).json({
      status: "error",
      message: "Email is already in user, please login",
    });
  } else if (existing_user) {
    const updated_user = await User.findOneAndUpdate(
      { email: email },
      filterBody,
      { new: true, validateModifiedOnly: true }
    );

    req.userId = existing_user._id;

    next();
  } else {
    // if user record is not available in DB
    const new_user = await User.create(filterBody);

    // generate OTP and send email to the user
    req.userId = new_user._id;
    next();
  }
};

exports.sendOTP = async (req, res, next) => {
  const { userID } = req;
  const new_otp = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const otp_expiry_time = Date.now() + 10 * 60 * 1000; // 10min after otp is sent

  await User.findByIdAndUpdate(userId, {
    otp: new_otp,
    otp_expiry_time,
  });

  // TODO Send Mail
  exports.veryifyOTP = async (req, res, next) => {
    // veryfyied OTP and update the user recored accourdingly
    const { email, otp } = req.body;
    const user = await User.findOne({
      email,
      otp_expiry_time: { $gt: Date.now() },
    });
    if (!user) {
      res.status(400).json({
        status: "error",
        message: "Email is invalid or OTP is expired",
      });
    }
    if (!(await user.correctOTP(otp, user.otp))) {
      res.status(400).json({
        status: "error",
        message: "OTP is incorrect",
      });
    }
  };

  res.status(200).json({
    status: "Success",
    message: "OTP send Successfully",
  });
};

// user OTP is correct
user.verified = true;
user.otp = undefined;
await user.save({ new: true, validateModifiedOnly: true });

const token = signToken(user._id);

req.status(200).json({
  status: "success",
  message: "OTP verified successfully",
  token,
});

// login functiollity
exports.login = async (req, res, next) => {
  //
  const { email, password } = req.body;

  if (!email && !password) {
    res.status(400).json({
      status: "error",
      message: "Both Email and passowrd are required ",
    });
  }

  const useDoc = await User.findOne({ email: email }).select("+password");

  if (!useDoc || !(await useDoc.correctPassword(password, useDoc.password))) {
    req.status(400).json({
      status: "error",
      message: " email or password are incorrect",
    });
  }

  const token = signToken(useDoc._id);

  req.status(200).json({
    status: 200,
    message: "Logged in successfully",
    token,
  });
};
