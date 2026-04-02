// src/utils/ApiResponse.js
class ApiResponse {
  static success(res, data, message = 'Success', status = 200) {
    return res.status(status).json({ success: true, message, data });
  }

  static paginated(res, { docs, total, page, pages }, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data: docs,
      pagination: { total, page, pages },
    });
  }

  static error(res, message, status = 500) {
    return res.status(status).json({ success: false, message });
  }
}

// src/utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// src/utils/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { ApiResponse, AppError, asyncHandler };
