const express = require('express');
const router = express.Router();


const authControllers = require("../controllers/authcontroller")




router.post("/login" ,authControllers.sendLoginOtp)
router.post("/verify-otp" ,authControllers.loginVerify)
router.post('/register', authControllers.createUser);





module.exports = router