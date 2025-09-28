// models/FormSubmission.js
const mongoose = require('mongoose');

const formSubmissionSchema = new mongoose.Schema({
  fullName: {
    type: String,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  phone: {
    type: String,
  },
  product: {
    type: String,
  },
  interested: {
    type: String,
    enum: ['Properties', 'Ride', 'Travel', 'Biz', 'Energy'],
    default: 'Properties'
  },
  message: {
    type: String
  },
  serviceType: {
    type: String,
    enum: ['NiftiLand', 'NiftiRide']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const FormSubmission = mongoose.model('FormSubmission', formSubmissionSchema);

module.exports = FormSubmission;