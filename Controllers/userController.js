const express = require('express');
const fs = require('fs');
const User = require('./../models/userModel');
const catchAsync = require('./../Utils/catchAsync');
const AppError = require('./../Utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

const users = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/users.json`)
);

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //1. Verify that there's no POSTed req with Password and ConfirmPassword
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'You are not allowed to perform this operation on this route!! Please use /updatePassword route.',
        400
      )
    );
  }

  //2. Filter our unwanted field names that are not allowed
  const filteredBody = filterObj(req.body, 'name', 'email');

  //3. Update User document.
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      User: updatedUser,
    },
  });
});

exports.createUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Instead User /Signup',
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'Success',
    data: null,
  });
});
