const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First Name is require"],
  },
  lastName: {
    type: String,
    required: [true, "Last Name is require"],
  },
  avatar: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "Email is require"],
    validate: {
      validator: function name(email) {
        return String(email)
          .toLowerCase()
          .match(/^[a-zA-Z0-9. _%+-]+@[a-zA-Z0-9. -]+\\. [a-zA-Z]{2,}$/);
      },
    },
    message: (props) => `Email (${props.value}) is invalid`,
  },
  password: {
    type: String,
  },
  passwordConform: {
    type: String,
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: Number,
  },
  otp_expiry_time: {
    type: Date,
  },
});

// execuete somthing berfor save
userSchema.pre("save", async function (next) {
  // Only run this fxn if OTP is actually modified

  if (!this.isModified("otp")) return next();

  // encrept the otp in db
  // hsah of the OTP with cost of 12
  this.otp = await bcryptjs.hash(this.otp, 12);
  next();
});

userSchema.methods.correctPassword = async function (
  canditatePassword, // 12345
  userPassword // wqwdncwcq
) {
  return await bcryptjs.compare(canditatePassword, userPassword);
};

userSchema.methods.correctOTP = async function (
  canditateOTP, // 12345
  userOTP // wqwdncwcq => have the all information
) {
  return await bcryptjs.compare(canditateOTP, userOTP);
};

userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.changePasswordAfter = function (timestamp) {
  return timestamp < this.passwordChangedAt;
};

const User = new mongoose.model("User", userSchema);

module.exports = User;
