const express = require('express');
const router = express.Router();
const multer = require("multer");

const authControllers = require("../controllers/authcontroller")

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./uploads/kyc"); // Upload directory
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${file.fieldname}-${uniqueSuffix}-${file.originalname}`);
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

router.post("/login" ,authControllers.sendLoginOtp)
router.post("/verify-otp" ,authControllers.loginVerify)
router.post('/register', authControllers.createUser);
router.post('/register-verify', authControllers.registerVerify);

router.put("/kyc/:userId",upload.fields([{ name: "adhaarFile", maxCount: 1 },{ name: "panFile", maxCount: 1 },]),authControllers.updateKycDetails);



module.exports = router