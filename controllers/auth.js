const jwt = require("jsonwebtoken");

//
const User = require("../models/user");

const signToken=(userId)=>jwt.sign({userId}, process.env.JWT_SECRET);

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

  const token =signToken(useDoc._id);

  req.status(200).json({
    status:200,
    message:"Logged in successfully",
    token,
  })
};
