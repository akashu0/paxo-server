const express = require('express');
const router = express.Router();
const { adminVerify, checkPermission } = require("../middlewares/admin");

const adminControllers = require("../controllers/adminController");

router.post('/create-admin-user', adminVerify, checkPermission("role", "create"),adminControllers.createAdmin);


router.post('/admin-login',adminControllers.adminLogin);

router.get(`/profile`, adminVerify,adminControllers.adminProfile);

router.get("/view-all-users", adminVerify, checkPermission("user", "view"),adminControllers.viewAllUsers );

router.get("/view-one/:id", adminVerify, checkPermission("user", "view"),adminControllers.viewOneUser);




module.exports = router;
