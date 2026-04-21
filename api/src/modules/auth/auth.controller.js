const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('./User');
const { asyncHandler, AppError } = require('../../utils');
const { createSendToken } = require('./auth.service');

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const newUser = await User.create({
    name,
    email,
    password,
  });

  await createSendToken(newUser, 201, req, res);
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  await createSendToken(user, 200, req, res);
});

exports.refreshToken = asyncHandler(async (req, res, next) => {
  // 1) Get refresh token from cookies
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return next(new AppError('No refresh token found', 401));
  }

  // 2) Verify refresh token
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return next(new AppError('Invalid refresh token', 401));
  }

  // 3) Check if user still exists
  const user = await User.findById(decoded.id);

  if (!user || !user.refreshToken) {
    return next(new AppError('The user belonging to this token no longer exists or is logged out.', 401));
  }

  // 4) Check if refresh token matches hashed version in DB
  const isCorrect = await user.correctRefreshToken(refreshToken, user.refreshToken);

  if (!isCorrect) {
    // If compromised, clear token for security
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Invalid refresh token. Possible reuse detected.', 401));
  }

  // 5) Generate and send new tokens
  await createSendToken(user, 200, req, res);
});

exports.logout = asyncHandler(async (req, res, next) => {
  // 1) Clear refreshToken in DB for current user
  if (req.user) {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = undefined;
      await user.save({ validateBeforeSave: false });
    }
  }

  // 2) Clear cookies
  res.cookie('refreshToken', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.cookie('isAuthenticated', 'false', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: false,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});

exports.updateMe = asyncHandler(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password) {
    return next(new AppError('This route is not for password updates. Please use /updatePassword.', 400));
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = {};
  if (req.body.name) filteredBody.name = req.body.name;
  if (req.body.email) filteredBody.email = req.body.email;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: {
      user: updatedUser
    }
  });
});

exports.updatePassword = asyncHandler(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  await user.save();

  // 4) Log user in, send JWT
  await createSendToken(user, 200, req, res);
});
