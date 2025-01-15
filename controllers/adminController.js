const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');





const Role = require("../models/role");
const Admin = require("../models/admin");
const { formatDate } = require('../utils/formatDate');

const secretKey = process.env.JWT_SECRET;

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

const adminProfile = async (req, res) => {
    const { id } = req.user;
    try {
      const user = await Admin.findOne({
        _id: id.toString(),
      }).populate("userRole")
      const role = await Role.findById(user.userRole._id).lean();
      if (!role) {
        return res.status(404).json({ error: "Role not found" })
      }
  
      
      const viewPermissions = {};
      for (const [key, permissions] of Object.entries(role.permissions)) {
        viewPermissions[key] = permissions.includes('view');
      }
      if (!user) {
        return res.status(404).json({ error: "User Not Found" });
      }
      res.json({ user, permission: viewPermissions });
    } catch (error) {
      res.status(500).json({ error: "Server Error" });
    }
  }

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

  module.exports = { 
    createAdmin,
    adminLogin,
    adminProfile,
    viewAllUsers,
    viewOneUser
};


