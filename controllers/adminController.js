const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const fs = require('fs').promises;
const path = require('path');



const Role = require("../models/role");
const Admin = require("../models/admin");
const User = require("../models/userModel")
const { formatDate } = require('../utils/formatDate');

const secretKey = process.env.JWT_SECRET;



// Helper function to delete file using async/await
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // If file doesn't exist, just log it
    if (error.code === 'ENOENT') {
      return;
    }
    throw error;
  }
};

const createAdmin = async (req, res) => {
    try {
      const { username, password, email, userRole } = req.body;
      // Validate required fields
      if (!username || !password || !email || !userRole) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
      const existingUser = await Admin.findOne({
        $or: [{ username }, { email }],
      });
      const roleExist = await Role.findById(userRole)
      if (!roleExist) {
        return res.status(400).json({ error: "Role dosen't exist" })
      }
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "Username or email already exists" });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      const adminUser = new Admin({
        username,
        email,
        password: hashedPassword,
        userRole: userRole,
      });
    
      await adminUser.save();
  
      res.status(201).json(adminUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error creating admin user" });
    }
  };

//Admin - Login
const adminLogin =  async (req, res) => {

    const { email, password } = req.body;
    const userAgent = req.headers["user-agent"];
    const currentTime = new Date().toISOString();
  
    const deviceID = userAgent + " " + currentTime;
    try {

    
      
      const user = await Admin.findOne({ email });
  
      if (!user) {
        return res.status(401).json({ error: "User Not Found" });
      }
  
      const passwordMatch = await bcrypt.compare(password, user.password);
  
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid Password" });
      }
  
      user.loggedInDevice.push({
        deviceID,
        date: currentTime,
      });
      await user.save();
  
      const payload = {
        loggedInDevice: deviceID,
        id: user._id,
      };
  
      const token = jwt.sign(payload, secretKey);
      res.status(200).json({
        token,
      });
    } catch (error) {
      console.log(error.message);
      
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  const kycLogin = async (req, res) => {
    const { email, password } = req.body;
    const userAgent = req.headers["user-agent"];
    const currentTime = new Date().toISOString();
    const deviceID = userAgent + " " + currentTime;
  
    try {
      // Find user and populate userRole
      const user = await Admin.findOne({ email }).populate('userRole');
  
      if (!user) {
        return res.status(401).json({ error: "User Not Found" });
      }
  
      // Check if user is active
      if (!user.status || user.status !== 'active') {
        return res.status(401).json({ error: "Account is not active" });
      }
  
      // Check if user has KYC role
      if (!user.userRole || user.userRole.name !== 'kyc') {
        return res.status(401).json({ error: "Unauthorized access" });
      }
  
      const passwordMatch = await bcrypt.compare(password, user.password);
  
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid Password" });
      }
  
      // Update logged in device
      user.loggedInDevice.push({
        deviceID,
        date: currentTime,
      });
      await user.save();
  
      const payload = {
        loggedInDevice: deviceID,
        id: user._id,
      };
  
      const token = jwt.sign(payload, secretKey);
      res.status(200).json({
        token});
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  const accountLogin = async (req, res) => {
    const { email, password } = req.body;
    const userAgent = req.headers["user-agent"];
    const currentTime = new Date().toISOString();
    const deviceID = userAgent + " " + currentTime;
  
    try {
      // Find user and populate userRole
      const user = await Admin.findOne({ email }).populate('userRole');
  
      if (!user) {
        return res.status(401).json({ error: "User Not Found" });
      }
  
      // Check if user is active
      if (!user.status || user.status !== 'active') {
        return res.status(401).json({ error: "Account is not active" });
      }
  
      // Check if user has account role
      if (!user.userRole || user.userRole.name !== 'accountant') {
        return res.status(401).json({ error: "Unauthorized access" });
      }
  
      const passwordMatch = await bcrypt.compare(password, user.password);
  
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid Password" });
      }
  
      // Update logged in device
      user.loggedInDevice.push({
        deviceID,
        date: currentTime,
      });
      await user.save();
  
      const payload = {
        loggedInDevice: deviceID,
        id: user._id,
      };
  
      const token = jwt.sign(payload, secretKey);
      res.status(200).json({
        token,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  

  const adminProfile = async (req, res) => {
    const { id } = req.user;
    try {
      // Find the admin user and populate userRole
      const user = await Admin.findOne({ _id: id.toString() }).populate("userRole", "name");
      
      if (!user) {
        return res.status(404).json({ error: "User Not Found" });
      }
  
      // Retrieve the role and its permissions
      const role = await Role.findById(user.userRole._id).lean();
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
  
      // Extract permissions and construct viewPermissions
      const allPermissions = {};
      for (const [key, permissions] of Object.entries(role.permissions)) {
        allPermissions[key] = {
          view: permissions.includes("view"),
          edit: permissions.includes("edit"),
          delete: permissions.includes("delete"),
          create: permissions.includes("create"),
        };
      }
  
      res.json({
        user:user.username,
        role: user.userRole.name,
        permissions: allPermissions,
      });
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      res.status(500).json({ error: "Server Error" });
    }
  };
  
  

const viewAllUsers = async (req, res) => {
    try {
      const { page = 1, pageSize = 5, search = "" } = req.query;
      const skip = (page - 1) * pageSize;
      const searchRegex = new RegExp(search, "i");
      const query = {
        $and: [
          {
            $or: [{ username: searchRegex }, { email: searchRegex }],
          },
          { username: { $ne: "root" } }
        ],
      };
      const allUsers = await Admin.find(query)
        .select("-password -loggedInDevice")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(pageSize))
        .populate({
          path: "userRole",
          select: "name",
        });
  
      const formattedUsers = allUsers.map((user) => {
        const formattedDate = formatDate(user.createdAt);
        return { ...user._doc, createdAt: formattedDate };
      });
  
      const totalUsers = await Admin.countDocuments(query);
  
      res.status(200).json({
        totalRows: totalUsers,
        data: formattedUsers,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
}

const viewOneUser =  async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Admin.findById(id)
      .select("-password -loggedInDevice")
      .populate({
        path: "userRole",
        select: "name",
      });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const formattedUser = {
      ...user._doc,
      createdAt: formatDate(user.createdAt),
    };

    res.status(200).json(formattedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
} 


const viewAllCustomer =async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const skip = (page - 1) * pageSize;

    const query = {
      role: 'user',
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ],
    };

    const [customers, totalRows] = await Promise.all([
      User.find(query)
        .skip(skip)
        .limit(parseInt(pageSize))
        .select('-password -otp -otpExpiry -loggedInDevice')
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.json({
      data: customers,
      totalRows,
      currentPage: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

const viewOneCustomer =  async (req, res) => {
  try {
    const customer = await User.findById(req.params.id)
      .select('-password -otp -otpExpiry');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

const updateKycStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isKycVerified, status, notes } = req.body;
    
    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          isKycVerified,
          'kyc.status': status,
          'kyc.reviewNotes': notes,
          'kyc.reviewedBy': req.user._id,
          'kyc.reviewedAt': new Date()
        }
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // You could add notification logic here
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating KYC status' });
  }
};

const customerStatis = async (req, res) => {
  try {
    const [totalUsers,totalBlocked, kycPending, kycVerified] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ status: 'inactive', role: 'user' }),
      User.countDocuments({ isKycVerified: false, role: 'user' }),
      User.countDocuments({ isKycVerified: true, role: 'user' })
    ]);

    res.json({
      totalUsers,
      totalBlocked,
      kycPending,
      kycVerified
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

const getKycStats = async (req, res) => {
  try {
    const stats = {
      pending: await User.countDocuments({ isKycVerified: false }),
      approved: await User.countDocuments({ isKycVerified: true }),
      rejected: await User.countDocuments({ 'kyc.status': 'rejected' }),
      flagged: await User.countDocuments({ 'kyc.status': 'flagged' }),
      totalToday: await User.countDocuments({
        createdAt: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999)
        }
      })
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching KYC statistics' });
  }
};


const updateKycDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { panNumber, adhaarNumber } = req.body;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Handle file uploads
    if (req.files) {
      // Delete old files if they exist and new files are being uploaded
      if (req.files.adhaarFile && user.kyc.adhaarFile) {
        const oldAdhaarPath = path.join(process.cwd(), user.kyc.adhaarFile);
        await deleteFile(oldAdhaarPath);
      }
      if (req.files.panFile && user.kyc.panFile) {
        const oldPanPath = path.join(process.cwd(), user.kyc.panFile);
        await deleteFile(oldPanPath);
      }

      // Save new files
      if (req.files.adhaarFile) {
        user.kyc.adhaarFile = `uploads/kyc/${req.files.adhaarFile[0].filename}`;
      }
      if (req.files.panFile) {
        user.kyc.panFile = `uploads/kyc/${req.files.panFile[0].filename}`;
      }
    }

    // Update document numbers if provided
    if (panNumber) user.kyc.panNumber = panNumber;
    if (adhaarNumber) user.kyc.adhaarNumber = adhaarNumber;

    // Update lastUpdatedAt
    user.kyc.lastUpdatedAt = new Date();

    await user.save();
    res.status(200).json({ 
      success: true, 
      message: "KYC documents updated successfully", 
      data: user 
    });
  } catch (error) {
    console.error("Error updating KYC documents:", error);
    res.status(500).json({ 
      success: false,
      error: "Error updating KYC documents",
      message: error.message 
    });
  }
};


const getKycSubmissions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const submissions = await User.find({})
      .select('username email phone kyc isKycVerified createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({});

    res.json({
      submissions,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching KYC submissions' });
  }
};

const getKycView = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select("-loggedInDevice -role -status -createdAt -updatedAt -__v");

    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user});
  } catch (error) {
    console.error("Error fetching KYC details:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};





const deleteKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete associated files if they exist
    if (user.kyc.adhaarFile) {
      // Construct absolute path using process.cwd()
      const adhaarPath = path.join(process.cwd(), user.kyc.adhaarFile);
      await deleteFile(adhaarPath);
    }
    
    if (user.kyc.panFile) {
      // Construct absolute path using process.cwd()
      const panPath = path.join(process.cwd(), user.kyc.panFile);
      await deleteFile(panPath);
    }

    // Clear KYC data
    user.kyc = {
      panNumber: '',
      adhaarNumber: '',
      adhaarFile: '',
      panFile: '',
      status: 'pending',
      reviewNotes: '',
      reviewedBy: null,
      reviewedAt: null,
      lastUpdatedAt: new Date()
    };
    user.isKycVerified = false;
    
    await user.save();
    res.json({ 
      success: true,
      message: 'KYC data deleted successfully' 
    });
  } catch (error) {
    console.error('Error in deleteKyc:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error deleting KYC data',
      message: error.message 
    });
  }
};


const blockAndUnblock = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = status;
    await user.save();

    res.json({ 
      message: `User ${status === 'active' ? 'unblocked' : 'blocked'} successfully`,
      user 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

  module.exports = { 
    createAdmin,
    adminLogin,
    adminProfile,
    viewAllUsers,
    viewOneUser,
    viewAllCustomer,
    viewOneCustomer,
    updateKycStatus,
    customerStatis,
    blockAndUnblock,
    getKycStats,
    updateKycDocuments,
    deleteKyc,
    getKycSubmissions,
    getKycView,
    kycLogin,
    accountLogin
};


