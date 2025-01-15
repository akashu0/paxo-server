const Property = require("../models/property");

exports.createProperty = async (req, res) => {
  try {
    const property = new Property(req.body);
    await property.save();
    res.status(201).json(property);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getProperties = async (req, res) => {
  try {
    const { serviceType, category, type } = req.query;
    const filter = {};
    
    if (serviceType) filter.serviceType = serviceType;
    if (category) filter.category = category;
    if (type) filter.type = type;
    
    const properties = await Property.find(filter)
      .populate('category')
      .sort({ createdAt: -1 });
    
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.getBoostIncomeProperties = async (req, res) => {
  try {
    const properties = await Property.find({
      serviceType: "BoostIncome",
      status: "active"
    })
      .populate("category") 
      .sort({ createdAt: -1 }); 

    res.json(properties); 
  } catch (error) {
    res.status(500).json({ message: error.message }); 
  }
};



exports.getPropertyBySlug = async (req, res) => {
  try {
    const { slug } = req.params; 

    const property = await Property.findOne({ slug, status: "active" })
      .populate("category") 
      .exec();

    if (!property) {
      return res.status(404).json({ message: "Property not found or inactive" });
    }

    res.json(property); 
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

