const express = require('express');
const router = express.Router();
const { adminVerify, checkPermission } = require("../middlewares/admin");
const multer = require("multer");
const fs = require('fs');
const path = require('path');

const adminControllers = require("../controllers/adminController");


// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/kyc"); // Ensure this directory exists
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const uniqueSuffix = `${timestamp}-${Math.round(Math.random() * 1E9)}`;
      const ext = path.extname(file.originalname);
  
      cb(null, `${uniqueSuffix}${ext}`);
    }
  });
  
  const upload = multer({ storage });

router.post('/create-admin-user', adminVerify, checkPermission("role", "create"),adminControllers.createAdmin);


router.post('/admin-login',adminControllers.adminLogin);
router.post('/kyc-login',adminControllers.kycLogin);
router.post('/account-login',adminControllers.accountLogin);

router.get(`/profile`, adminVerify,adminControllers.adminProfile);

router.get("/view-all-users", adminVerify, checkPermission("user", "view"),adminControllers.viewAllUsers );

router.get("/view-one/:id", adminVerify, checkPermission("user", "view"),adminControllers.viewOneUser);

router.get("/view-all-customers", adminVerify, checkPermission("user", "view"),adminControllers.viewAllCustomer );

router.get("/view-customers/:id", adminVerify, checkPermission("user", "view"),adminControllers.viewOneCustomer);

// Update KYC status
router.put('/update-kyc-status/:id', adminVerify,checkPermission("kyc", "edit"), adminControllers.updateKycStatus);

// Get customer statistics and kyc routes
router.get('/customer-stats', adminVerify,checkPermission("user", "view"), adminControllers.customerStatis);
router.get('/kyc-stats', adminVerify,checkPermission("kyc", "view"), adminControllers.getKycStats);
router.put(
    '/kyc-documents/:id',
    adminVerify,
    checkPermission("user", "edit"),
    upload.fields([
      { name: 'adhaarFile', maxCount: 1 },
      { name: 'panFile', maxCount: 1 }
    ]),
    adminControllers.updateKycDocuments
  );
  router.delete('/kyc/:id', adminVerify, checkPermission("kyc", "delete"), adminControllers.deleteKyc);
  router.get('/kyc-submissions', adminVerify,checkPermission("kyc", "view"), adminControllers.getKycSubmissions);
  router.get('/kyc-submissions/:id', adminVerify,checkPermission("kyc", "view"), adminControllers.getKycView);


// block and unblock
router.put('/update-user-status/:id', adminVerify,checkPermission("user", "edit"),adminControllers.blockAndUnblock );


module.exports = router;
