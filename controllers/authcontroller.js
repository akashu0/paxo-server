const User = require('../models/userModel');
const{ sendOtp } = require( '../utils/twilioService');
const jwt = require('jsonwebtoken');

// Generate a random 4-digit OTP
function generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  const generateToken = (user) => {
    const payload = {
        id: user._id,
        phone: user.phone,
        role: user.role
    };
    const secret = process.env.JWT_SECRET 
    return jwt.sign(payload, secret);
};

const sendLoginOtp = async(req,res) => {

    const { phone } = req.body;

    // Check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: 'User with this phone number does not exist. Please register first.' });
    }
  
    // Generate OTP
    const otp = generateOtp();
  
    // Send OTP using Twilio
    try {
      await sendOtp(phone, otp);
  
      // Update user with OTP
      user.otp = otp;
      await user.save();
      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to send OTP', error });
      console.log(error.message);
    }

  }


const loginVerify = async(req,res) => {
    const { phone, otp } = req.body;

    // Find the user by phone and OTP
    const user = await User.findOne({ phone, otp }).select("-password")
    if (!user) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
  
    // Verify user
    user.otp = undefined; // Remove OTP after verification
    await user.save();
  
    // Generate JWT token
    const token = generateToken(user);
  
    res.status(200).json({ message: 'User logged in successfully', user, token });
}



module.exports = {
    sendLoginOtp,
    loginVerify
  }