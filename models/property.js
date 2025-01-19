const mongoose = require("mongoose");
const slugify = require("slugify");

const propertySchema = new mongoose.Schema(
  {
    property_name: { type: String,trim: true,required: true},
    
    property_type: {
      type: String,
      trim: true,
      required: true,
    },
    property_subName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    total_unit: {
      type: Number,
      required: true,
    },
    available_unit: {
      type: Number,
      required: true,
    },
    demand: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
    property_location: {
      type: String,
      trim: true,
      required: true,
    },
    property_city: {
      type: String,
      trim: true,
      required: true,
    },
    property_unit_price: {
      type: Number,
      trim: true,
      required: true,
    },
    capital_appreciation: {
      type: String,
      trim: true,
      required: true,
    },
    property_img: {
      type: String,
    },
    marketValue: {
      type: String,
      required: true,
    },
    status: {
      type: String,
    },
    isActive: {
      type: String,
      enum: ["active", "inactive", "deleted"],
      default: "inactive",
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    approvedAt: {
      type: Date
    },
    survey_no: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    serviceType: {
      type: String,
      enum: ['BoostIncome', 'DirectSave', 'RentLease'],
      required: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    },
  },
  { timestamps: true }
);

// Pre-save middleware to generate slug
propertySchema.pre("save", function (next) {
  if (this.isModified("property_name")) {
    this.slug = slugify(this.property_name, { lower: true, strict: true });
  }
  next();
});

const Property = mongoose.model("Property", propertySchema);

module.exports = Property;
