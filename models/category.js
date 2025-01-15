// models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim:true
  },
  value: {
    type: String,
    required: true,
    trim:true
  },
  description: {
    type: String,
    required: true,
    trim:true
  },
  range: {
    type: String,
    required: true,
    trim:true
  },
  serviceType: {
    type: String,
    enum: ['BoostIncome', 'DirectSave', 'RentLease'],
    required: true
  }
}, {
  timestamps: true
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;