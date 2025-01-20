const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payoutController');
const {userVerify} = require("../middlewares/user")



router.get('/payout-summary', userVerify, payoutController.getPayoutSummary);
router.get('/payout-history', userVerify, payoutController.getPayoutHistory);









module.exports = router