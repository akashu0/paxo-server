const express = require('express');
const router = express.Router();
const { adminVerify, checkPermission } = require("../middlewares/admin");

const adminControllers = require("../controllers/adminController");

router.post('/create-admin-user', adminVerify, checkPermission("role", "create"),adminControllers.createAdmin);


router.post('/admin-login',adminControllers.adminLogin);

router.get(`/profile`, adminVerify,adminControllers.adminProfile);

router.get("/view-all-users", adminVerify, checkPermission("user", "view"),adminControllers.viewAllUsers );

router.get("/view-one/:id", adminVerify, checkPermission("user", "view"),adminControllers.viewOneUser);

router.get("/view-all-customers", adminVerify, checkPermission("user", "view"),adminControllers.viewAllCustomer );

router.get("/view-customers/:id", adminVerify, checkPermission("user", "view"),adminControllers.viewOneCustomer);

// Update KYC status
router.put('/update-kyc-status/:id', adminVerify,checkPermission("user", "edit"), adminControllers.updateKycStatus);

// Get customer statistics
router.get('/customer-stats', adminVerify,checkPermission("user", "view"), adminControllers.customerStatis);

// block and unblock
router.put('/update-user-status/:id', adminVerify,checkPermission("user", "edit"),adminControllers.blockAndUnblock );


module.exports = router;
