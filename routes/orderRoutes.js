const express = require('express');
const router = express.Router();
const {adminVerify,checkPermission } = require("../middlewares/admin")
const {userVerify} = require("../middlewares/user")
const multer = require('multer');
const path = require('path')

const orderController = require('../controllers/orderController');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/payment-proofs/');  
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  const fileFilter = (req, file, cb) => {
    // Accept images and PDFs only
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
    }
  };
  
  const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });


router.post('/create-order',userVerify,upload.single('paymentProof'),  orderController.createOrder);
router.get('/my-orders', userVerify, orderController.getUserOrders);
router.get('/my-confirm-orders', userVerify, orderController.getConfirmedUserOrders);
router.get('/order-detail/:id', orderController.getOrderById);


// Admin routes
router.get('/all-order', adminVerify,  orderController.getAllOrders);
router.post('/verify-payment/:orderId', adminVerify, orderController.verifyPayment);


module.exports = router