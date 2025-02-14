
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const workflowSchema = new Schema({
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
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    steps: [{
      name: String,
      description: String,
      assignedRole: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
      },
      requiredPermissions: {
        type: Map,
        of: [String]
      },
      order: Number,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending'
      }
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'archived'],
      default: 'draft'
    }
  }, {
    timestamps: true
  });
  
  const Workflow = mongoose.model('Workflow', workflowSchema);
  module.exports = Workflow;
  