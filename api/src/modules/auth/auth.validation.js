const Joi = require('joi');

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email().messages({
      'string.email': 'Please provide a valid email address',
    }),
    password: Joi.string().required().min(8).messages({
      'string.min': 'Password must be at least 8 characters long',
    }),
    name: Joi.string().required().trim(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
};

module.exports = {
  register,
  login,
};
