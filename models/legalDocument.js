const mongoose = require("mongoose");

const legalDocumentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true
    },
    documentStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending'
    },

    documentFiles: [{
      title: { type: String, required: true },
      fileUrl: { type: String, required: true },
      uploadDate: { type: String, required: true }
    }],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' 
    },
    remarks: [{
      comment: { type: String },
      commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      commentDate: { type: String }
    }],
    completionDate: {
      type: String
    },
    isActive: {
      type: String,
      enum: ["active", "inactive", "deleted"],
      default: "active"
    }
  },
  { timestamps: true }
);

const LegalDocument = mongoose.model("LegalDocument", legalDocumentSchema);
module.exports = LegalDocument;