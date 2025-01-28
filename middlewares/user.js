const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const User = require('../models/userModel');
const secretKey = process.env.JWT_SECRET;





const userVerify = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        
        jwt.verify(token, secretKey, async (err, user) => {
            if (err) {
                return res.status(401).json({ error: "Token is not valid", action: "logout" });
            }
            req.user = user;

            try {
                const existingUser = await User.findOne({ _id: user.id });
                if (!existingUser) {
                    return res.status(401).json({ error: "User Not Found", action: "logout" });
                }

                // const userDevice = user.loggedInDevice;
                // const deviceExists = existingUser.loggedInDevice.some(device => device.deviceID === userDevice);

                // if (!deviceExists) {
                //     return res.status(401).json({ error: "Session Expired", action: "logout" });
                // }

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
const setupMiddleware = async (req, res, next) => {
    const fingerprint = req.query.fingerprint;
    req.fingerprint = { hash: fingerprint };
    next();
  }

module.exports = { userVerify ,setupMiddleware };