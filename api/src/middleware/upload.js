const multer = require('multer');
const path = require('path');
const { AppError } = require('../utils');

// Multer memory storage configuration (for uploading to Google Drive)
const storage = multer.memoryStorage();

// File filter (optional: limit to pdf, doc, docx)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF and Word documents are allowed', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = upload;
