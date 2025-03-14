const mongoose = require("mongoose");

const FormSubmissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    interested: { type: Boolean, default: false },
    serviceType: { type: String, enum: ["NiftyLand", "NiftyRide"], required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FormSubmission", FormSubmissionSchema);
