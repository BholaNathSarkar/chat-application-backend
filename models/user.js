const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

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
});

userSchema.methods.correctPassword = async function (
  canditatePassword, // 12345
  userPassword // wqwdncwcq
) {
  return await bcryptjs.compare(canditatePassword, userPassword);
};

const User = new mongoose.model("User", userSchema);

module.exports = User;
