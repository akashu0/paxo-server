const express = require("express");
const router = express.Router();

const boostincomeController = require("../controllers/boostincomeController");
const { userVerify } = require("../middlewares/user")

// Routes
router.post("/boostincome",userVerify, boostincomeController.createBoostIncome);
router.get("/get-boostincome", boostincomeController.getAllBoostIncome);
router.get("/boostincome/:id", boostincomeController.getBoostIncomeById);
router.put("/boostincome/:id", boostincomeController.updateBoostIncome);
router.delete("/boostincome/:id", boostincomeController.deleteBoostIncome);

module.exports = router;
