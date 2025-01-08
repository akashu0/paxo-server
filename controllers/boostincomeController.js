const BoostIncome = require("../models/boostincome");

// Create BoostIncome
exports.createBoostIncome = async (req, res) => {
  try {
    const boostIncome = new BoostIncome(req.body);
    await boostIncome.save();
    res.status(201).json(boostIncome);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all BoostIncome records
exports.getAllBoostIncome = async (req, res) => {
  try {
    const boostIncomeRecords = await BoostIncome.find();
    res.status(200).json(boostIncomeRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get BoostIncome by ID
exports.getBoostIncomeById = async (req, res) => {
  try {
    const boostIncome = await BoostIncome.findById(req.params.id);
    if (!boostIncome) {
      return res.status(404).json({ message: "BoostIncome not found" });
    }
    res.status(200).json(boostIncome);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update BoostIncome
exports.updateBoostIncome = async (req, res) => {
  try {
    const boostIncome = await BoostIncome.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!boostIncome) {
      return res.status(404).json({ message: "BoostIncome not found" });
    }
    res.status(200).json(boostIncome);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete BoostIncome
exports.deleteBoostIncome = async (req, res) => {
  try {
    const boostIncome = await BoostIncome.findByIdAndDelete(req.params.id);
    if (!boostIncome) {
      return res.status(404).json({ message: "BoostIncome not found" });
    }
    res.status(200).json({ message: "BoostIncome deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
