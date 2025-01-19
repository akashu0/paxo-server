const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const secretKey = process.env.JWT_SECRET;
const Admin = require('../models/admin');



const adminVerify = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, secretKey, async (err, user) => {
            if (err) {
                return res.status(401).json({ error: "Token is not valid", action: "logout" });
            }
            req.user = user;

            try {
                const existingUser = await Admin.findOne({ _id: user.id });
                if (!existingUser) {
                    return res.status(401).json({ error: "User Not Found", action: "logout" });
                }

                const userDevice = user.loggedInDevice;
                const deviceExists = existingUser.loggedInDevice.some(device => device.deviceID === userDevice);

                if (!deviceExists) {
                    return res.status(401).json({ error: "Session Expired", action: "logout" });
                }

                next();
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
    } else {
        res.status(400).json({ error: "You are not authenticated" });
    }
}

const checkPermission = (module, action) => {
    return async (req, res, next) => {
      try {
        // Fetch the admin and their role
        const admin = await Admin.findById(req.user.id).populate("userRole");
        if (!admin) {
          return res.status(404).json({ error: "User not found" });
        }
  
        // Check if the user has the RootAdmin role
        if (admin.userRole.name === "rootadmin") {
          return next(); // Skip permission checks for RootAdmin
        }
  
        // Check permissions for other roles
        const permissions = admin.userRole.permissions[module];
        if (!permissions || !permissions.includes(action)) {
          return res.status(403).json({ error: "Access denied" });
        }
  
        // Proceed to the next middleware or route handler
        next();
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    };
  };
  



module.exports = { adminVerify, checkPermission };