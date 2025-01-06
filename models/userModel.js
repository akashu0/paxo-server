const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
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
        required: false,
        trim: true,
    },
    otpExpiry: {
  type : Date
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        trim: true,
    },
    fatherName: {
        type: String,
        trim: true
    },
    age: {
        type: String,
        trim: true
    },
    isKycVerified: {
        type: Boolean,
        default: false,
    },
    user_img: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },

}, { 
    timestamps: true 
});




const User = mongoose.model('User', userSchema);

module.exports = User;