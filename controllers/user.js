const User = require("../models/user");
const filterObj = require("../utils/filterObj");

exports.updateMe = async (req, res, next) => {
  const { user } = req;

  const filterBody = filterObj(
    req.body,
    "firstName",
    "lastName",
    "about",
    "avater"
  );

  const updated_user = await User.findByIDAndUpdate(user._id, filterBody, {
    new: true,
    // This validate all the validater what we place in user schema only those filed which we are modified
    validateModifiedOnly: true,
  });
  res.status(200).json({
    status: "success",
    data: updated_user,
    message: "Profile Updated successfully",
  });
};
