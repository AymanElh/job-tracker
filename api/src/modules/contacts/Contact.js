const mongoose = require('mongoose');
const { Schema } = mongoose;

const contactSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
  },
  role: {
    type: String,
    trim: true,
    placeholder: 'e.g., Senior Recruiter, Engineering Manager'
  },
  company: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  linkedinUrl: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  }
}, {
  timestamps: true,
});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
