const mongoose = require("mongoose");
const slugify = require("slugify");

const boostincomeSchema = new mongoose.Schema(
  {
    categoryName: {type: String},
    property_name: { type: String,trim: true,required: true},
    property_type: {
      type: String,
      trim: true,
      required: true,
    },
    property_owner: {
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
      default: "active",
    },
    survey_no: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

// Pre-save middleware to generate slug
boostincomeSchema.pre("save", function (next) {
  if (this.isModified("property_name")) {
    this.slug = slugify(this.property_name, { lower: true, strict: true });
  }
  next();
});

const BoostIncome = mongoose.model("BoostIncome", boostincomeSchema);

module.exports = BoostIncome;
