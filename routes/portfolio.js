const express = require("express");
const portfolioController = require("../controllers/portfolioController");

const router = express.Router();

// Portfolio Routes
router.post("/portfolios", portfolioController.createPortfolio);
router.get("/portfolios", portfolioController.getAllPortfolios);
router.get("/portfolios/:id", portfolioController.getPortfolioById);
router.put("/portfolios/:id", portfolioController.updatePortfolio);
router.delete("/portfolios/:id", portfolioController.deletePortfolio);

module.exports = router;
