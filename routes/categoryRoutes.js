const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

const {adminVerify,checkPermission } = require("../middlewares//admin")


router.post('/create-category', adminVerify, categoryController.createCategory);
router.get('/get-category', categoryController.getCategories);
router.put('/update-category/:id', adminVerify, categoryController.updateCategory);



router.get('/get-boostincome-category', categoryController.getBoostincomeCategories);

module.exports = router;
