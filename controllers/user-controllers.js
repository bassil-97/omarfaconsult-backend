const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const HttpError = require("../models/http-error");

const register = async (req, res, next) => {
  let newUser;
  let hashedPassword;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: req.body.email });
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exist already, please login instead.",
      422
    );
    return next(error);
  }

  try {
    hashedPassword = await bcrypt.hash(req.body.password, 10);
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Could not create account, please try again.",
      500
    );
    return next(error);
  }

  newUser = new User({
    email: req.body.email,
    password: hashedPassword,
    userName: req.body.userName,
  });

  try {
    await newUser.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Signing up failed, please try again.", 500);
    return next(error);
  }

  //Add JWT token

  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      "RANDOM-TOKEN",
      { expiresIn: "24h" }
    );
  } catch (err) {
    const error = new HttpError("Signing up failed, please try again.", 500);
    return next(error);
  }

  res.status(201).json({
    token: token,
    userId: newUser.id,
    email: newUser.email,
    username: newUser.userName,
    courses: newUser.courses,
  });
};

const login = async (req, res, next) => {
  let { email, password } = req.body;
  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again.",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      "RANDOM-TOKEN",
      { expiresIn: "24h" }
    );
  } catch (err) {
    const error = new HttpError("Logging in failed, please try again.", 500);
    return next(error);
  }

  res.json({
    email: existingUser.email,
    id: existingUser.id,
    userName: existingUser.userName,
    token: token,
  });
};

const handlePurchaseCourse = async (req, res, next) => {
  const { amount, items, userId } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ _id: userId });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find user with this id.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Could not find user for the provided id.",
      404
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    for (let item of items) {
      existingUser.courses.push(item.id);
    }

    await existingUser.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not save user links.",
      500
    );
    return next(error);
  }

  res.status(201).json({ coursesAdded: true });
};

const getUserCourses = async (req, res, next) => {
  let userId = req.params.userId;

  let existingUser, courses;
  try {
    existingUser = await User.findOne({ _id: userId });
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find user with this id.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Could not find user for the provided id.",
      404
    );
    return next(error);
  }

  courses = existingUser.courses;
  res.json({
    courses: courses,
  });
};

exports.register = register;
exports.login = login;
exports.handlePurchaseCourse = handlePurchaseCourse;
exports.getUserCourses = getUserCourses;
