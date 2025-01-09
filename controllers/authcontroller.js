const User = require('../models/userModel');
const{ sendOtp } = require( '../utils/twilioService');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

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
    const user = await User.findOne({ phone, otp })

    if (!user) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
  
    // Verify user
    user.otp = undefined; // Remove OTP after verification
    await user.save();
  
    // Generate JWT token
    const token = generateToken(user);
  
    res.status(200).json({ message: 'User logged in successfully', name:user.username, token });
}

const registerVerify = async(req,res) => {
    const { phone, otp } = req.body;


    // Find the user by phone and OTP
    const user = await User.findOne({ phone, otp })

    if (!user) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
  
    // Verify user
    user.otp = undefined; // Remove OTP after verification
    user.status= "active"
    await user.save();
  
    // Generate JWT token
    const token = generateToken(user);
  
    res.status(200).json({ message: 'User logged in successfully', name:user.username, token });
}

const createUser = async (req, res) => {
  try {
  const { username, phone,email } = req.body;

  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    return res.status(400).json({ message: 'User with this phone number already exists' });
  }

  // Generate OTP
  const otp = generateOtp();

  

  // Send OTP using Twilio

    // await sendOtp(phone, otp);

    // Create a new user with OTP (without saving yet)
    const user = new User({
      username,
      phone,
      email,
      otp,
      status: "inactive"
    });

    await user.save();
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error });
    console.log(error.message);
  }
}

// Update KYC details with file uploads
const updateKycDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { panNumber, adhaarNumber, username } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update KYC fields
    if (panNumber) user.kyc.panNumber = panNumber;
    if (adhaarNumber) user.kyc.adhaarNumber = adhaarNumber;

    if (req.files) {
      // Handle Aadhaar file
      if (req.files.adhaarFile) {
        // Delete old Aadhaar file if it exists
        if (user.kyc.adhaarFile) {
          try {
            await fs.unlink(user.kyc.adhaarFile);
          } catch (error) {
            console.error('Error deleting old Aadhaar file:', error);
          }
        }
        user.kyc.adhaarFile = req.files.adhaarFile[0].path;
      }

      // Handle PAN file
      if (req.files.panFile) {
        // Delete old PAN file if it exists
        if (user.kyc.panFile) {
          try {
            await fs.unlink(user.kyc.panFile);
          } catch (error) {
            console.error('Error deleting old PAN file:', error);
          }
        }
        user.kyc.panFile = req.files.panFile[0].path;
      }
    }

    user.username = username;
    user.isKycVerified = true;
    
    await user.save();
    
    res.status(200).json({ 
      message: "KYC details updated successfully", 
      user 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user profile", error });
  }
};


const updateBankDetails = async (req, res) => {
  try {
    const userId = req.user.id; 
    const {  accountNumber, ifscCode, bankName } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "bankDetails.accountNumber": accountNumber,
          "bankDetails.ifscCode": ifscCode,
          "bankDetails.bankName": bankName,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Bank details updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Failed to update bank details", error });
  }
};


const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, phone } = req.body;
    
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle profile image upload
    let user_img = currentUser.user_img; // Keep existing image by default
    if (req.file) {
      // If there's an existing image, delete it
      if (currentUser.user_img) {
        try {
          await fs.unlink(currentUser.user_img);
        } catch (error) {
          console.error('Error deleting old profile image:', error);
          // Continue with update even if delete fails
        }
      }
      user_img = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          username,
          email,
          phone,
          user_img,
        },
      },
      { new: true }
    );

    res.status(200).json({ 
      message: "User profile updated successfully", 
      user: updatedUser 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to update user profile", 
      error: error.message 
    });
  }
};

// / Separate controller for handling profile image updates

const updateProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ 
        message: "No image file provided" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old profile image if it exists
    if (user.user_img) {
      try {
        await fs.unlink(user.user_img);
      } catch (error) {
        console.error('Error deleting old profile image:', error);
      }
    }

    // Update with new image path
    user.user_img = req.file.path;
    await user.save();

    res.status(200).json({ 
      message: "Profile image updated successfully",
      user 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to update profile image", 
      error: error.message 
    });
  }
};

module.exports = {
    sendLoginOtp,
    loginVerify,
    createUser,
    updateKycDetails,
    registerVerify,
    getProfile,
    updateUserProfile,
    updateBankDetails
  }