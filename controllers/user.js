const FriendRequest = require("../models/friendRequest");
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

exports.getUsers = async (req, res, next) => {
  const all_user = await User.find({
    verified: true,
  }).select("firstName lastName _id");

  const this_user = req.user;
  const remaing_users = all_user.filter(
    (user) =>
      !this_user.friends.includes(user._id) &&
      user._id.toString() !== req.user._id.toString()
  );
  res.status(200).json({
    status: "success",
    data: remaing_users,
    message: "Users found successfully",
  });
};

exports.getRequests = async (req, res, next) => {
  console.log(`recipent: ${req.user._id}`);
  const requests = await FriendRequest.find({ recipent: req.user._id })
    .populate("sender")
    .select("_id firstName lastName");
console.log(requests);
  res.status(200).json({
    status: "success",
    data: requests,
    message: "Requests found successfully!",
  });
};

exports.getFriends = async (req, res, next) => {
  const this_user = await User.findById(req.user._id).populate(
    "friends",
    "_id firstName lastName"
  );
  res.status(200).json({
    status: "success",
    data: this_user.friends,
    message: "FriendRequest successfully",
  });
};
