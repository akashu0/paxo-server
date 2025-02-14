const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teamSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: String,
  department: {
    type: String,
    enum: ['properties', 'order', 'legal', 'accountant', 'category', 'prelistedBuyer', 'properties_owner'],
    required: true
  },
  teamLead: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin',
    required: true 
  },
  members: [{
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    userRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;
