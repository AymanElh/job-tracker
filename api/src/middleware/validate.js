const Joi = require('joi');
const { AppError } = require('../utils');

/**
 * Middleware for validating request data against a Joi schema
 * @param {Object} schema - Joi schema object containing keys for body, query, and params
 */
const validate = (schema) => (req, res, next) => {
  const validSchema = {};
  const object = {};

  ['params', 'query', 'body'].forEach((key) => {
    if (schema[key]) {
      validSchema[key] = schema[key];
      object[key] = req[key];
    }
  });

  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    const errorMessage = error.details
      .map((details) => details.message)
      .join(', ');
    return next(new AppError(errorMessage, 400));
  }

  Object.assign(req, value);
  return next();
};

module.exports = validate;
