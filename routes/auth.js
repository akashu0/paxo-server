const express = require('express');
const router = express.Router();
const multer = require("multer");

const authControllers = require("../controllers/authcontroller")

const { userVerify } = require("../middlewares/user")

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./uploads/kyc"); // Upload directory
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${req.body.username}-${uniqueSuffix}-${file.originalname}`);
    },
  });

  const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      // Accept only images and PDFs
      if (
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/png" ||
        file.mimetype === "application/pdf"
      ) {
        cb(null, true);
      } else {
        cb(new Error("Only image and PDF files are allowed"));
      }
    },
  });

  // Multer configuration for profile image uploads
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/profile"); // Profile images directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `profile-${uniqueSuffix}-${file.originalname}`);
  },
}); 

const profileUpload = multer({
  storage: profileStorage,
  fileFilter: (req, file, cb) => {
    // Accept only images for profile pictures
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG and PNG images are allowed for profile pictures"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

router.post("/login" ,authControllers.sendLoginOtp)
router.post("/verify-otp" ,authControllers.loginVerify)
router.post('/register', authControllers.createUser);
router.post('/register-verify', authControllers.registerVerify);

router.put("/kyc",userVerify,upload.fields([{ name: "adhaarFile", maxCount: 1 },{ name: "panFile", maxCount: 1 },]),authControllers.updateKycDetails);

router.get("/profile", userVerify, authControllers.getProfile);
router.put("/profile", userVerify, profileUpload.single('user_img'), authControllers.updateUserProfile);
router.put("/bank-details", userVerify, authControllers.updateBankDetails);

  

module.exports = router