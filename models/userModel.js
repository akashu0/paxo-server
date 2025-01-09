const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    otp: {
      type: String,
      trim: true,
    },
    otpExpiry: {
      type: Date,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      trim: true,
    },
    kyc: {
      panNumber: {
        type: String,
        trim: true,
      },
      adhaarNumber: {
        type: String,
        trim: true,
      },
      adhaarFile: {
        type: String,
      },
      panFile: {
        type: String,
      },
    },
    age: {
      type: Number,
      min: 0,
      trim: true,
    },
    isKycVerified: {
      type: Boolean,
      default: false,
    },
    user_img: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    loggedInDevice: [
      {
        deviceID: { type: String },
        date: { type: Date },
      },
    ],
    bankDetails: {
      accountHolderName: {
        type: String,
        trim: true,
      },
      accountNumber: {
        type: String,
        trim: true,
      },
      ifscCode: {
        type: String,
        trim: true,
      },
      bankName: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
