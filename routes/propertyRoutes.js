const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

const {adminVerify,checkPermission } = require("../middlewares//admin")



router.post('/create-property',adminVerify,checkPermission("properties","create"),propertyController.createProperty);
router.get('/get-property',adminVerify, propertyController.getProperties);

router.get("/get-boostincome-property",propertyController.getBoostIncomeProperties);
router.get("/get-property-by-slug/:slug", propertyController.getPropertyBySlug);
router.patch(
    "/update-status/:propertyId",
    adminVerify,
    checkPermission("property", "edit"),
    propertyController.updatePropertyStatus
  );
router.delete(
    "/delete-property/:propertyId",
    adminVerify,
    checkPermission("property", "delete"),
    propertyController.deleteProperty
  );

router.post("/capital-appreciation/::propertyId", propertyController.addCapitalappreciation);

  

module.exports = router;