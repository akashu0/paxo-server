const Category = require('../models/category');

exports.createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const { serviceType } = req.query;
    const filter = serviceType ? { serviceType } : {};
    const categories = await Category.find(filter);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBoostincomeCategories = async (req, res) => {
  try {
    const categories = await Category.find({serviceType: "BoostIncome"});
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find the category by ID and update it with the provided data
    const category = await Category.findByIdAndUpdate(id, updates, {
      new: true, 
      runValidators: true, 
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ message: 'Category updated successfully', category });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
