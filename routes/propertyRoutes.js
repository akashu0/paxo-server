const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

const {adminVerify,checkPermission } = require("../middlewares//admin")



router.post('/create-property',adminVerify,checkPermission("properties","create"),propertyController.createProperty);
router.get('/get-property', propertyController.getProperties);

router.get("/get-boostincome-property",propertyController.getBoostIncomeProperties);
router.get("/get-property-by-slug/:slug", propertyController.getPropertyBySlug);


module.exports = router;