const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
};

const createSendToken = async (user, statusCode, req, res) => {
  const token = signToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  // Hash the refresh token and save to DB
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
  user.refreshToken = hashedRefreshToken;
  await user.save({ validateBeforeSave: false });

  // Set the refresh token in an HttpOnly cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_REFRESH_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  // Also set a non-httpOnly cookie for the middleware to check authentication status
  res.cookie('isAuthenticated', 'true', {
    ...cookieOptions,
    httpOnly: false,
    maxAge: parseInt(process.env.JWT_REFRESH_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000
  });

  // Remove password from output
  user.password = undefined;
  user.refreshToken = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user,
    },
  });
};

module.exports = { signToken, signRefreshToken, createSendToken };
