const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const crypto = require("crypto");

//
const User = require("../models/user");
const filterObj = require("../utils/filterObj");
const { promisify } = require("util");

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);

// Signup => register -> sendOTP -> verifyOTP

// https://api.tawk.com/auth/register

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
  const { userId } = req;
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

// Types of routes => Proctected ( Only loggin user can access these) & Unprocted

// only users who can login your system who can access our API
exports.proctect = async (req, res, next) => {
  // 1) Getting the token (JWT) cancheck if it's there

  let token;
  if (req.headers.authorization && req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else {
    req.status(400).json({
      status: "err",
      message: "You are not logged in! please log in to get access",
    });
  }

  // 2) Verification of token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if the user still exeist
  const this_user = await User.findById(decoded.userId);

  if (!this_user) {
    res.status(400).json({
      status: "error",
      message: " The user does't exist",
    });
  }

  // 4) check if user changed their password after token was issued
  if (this_user.changePasswordAfter(decoded.iat)) {
    res.status(400).json({
      status: "error",
      message: "User recently updated password! Please log in again",
    });
  }
  req.user = this_user;
  next();
};

exports.forgotPassword = async (req, res, next) => {
  // 1) get users email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    res.status(400).json({
      status: "error",
      message: "No user with given email address",
    });
    return;
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  const resetURL = `https://tawk.com/auth/reset-password/?code=${resetToken}`;

  try {
    // TODO => Send email with reset URL

    res.status(200).json({
      status: "success",
      message: "Reset Password link sent to email",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
  }
  await user.save({ validateBeforeSave: false });

  res.status(500).json({
    status: "error",
    message: "There was an error in sending email please try again later",
  });
};

exports.resetPassword = async (req, res, next) => {
  const hasToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hasToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) if token is expire or submission time is expire
  if (!user) {
    res.status(400).json({
      status: "error",
      message: "Token is invalid or Expire",
    });
    return;
  }

  // 3) Update user password and set resetToken & expiry to undefined
  user.password = req.body.password;
  user.passwordConform = req.body.passwordConform;

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  //  TODO => send an email to user informing about password

  // 4) Log in the user and send new JWT

  const token = signToken(user._id);

  req.status(200).json({
    status: 200,
    message: "Password Reset Successfully",
    token,
  });
};
