const Property = require("../models/property");
const User = require("../models/admin")


const isRootAdmin = async (userId) => {
  try {
    const user = await User.findById(userId).populate('userRole');
    return user && user.userRole && user.userRole.name === 'rootadmin';
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
};

// Create Property
exports.createProperty = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = await isRootAdmin(userId);

    const propertyData = {
      ...req.body,
      addedBy: userId,
      status: isAdmin ? 'active' : 'inactive',
      approvalStatus: isAdmin ? 'approved' : 'pending'
    };

    const property = new Property(propertyData);
    await property.save();

    res.status(201).json({
      success: true,
      message: isAdmin ? 'Property created successfully' : 'Property created and pending approval',
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating property'
    });
  }
};

// Get properties based on user role
exports.getProperties = async (req, res) => {
  try {
    const isAdmin = await isRootAdmin(req.user.id);
  
    
    
    let query = { isActive: { $ne: 'deleted' } };
    
    // Apply filters if provided
    if (req.query.status) query.status = req.query.status;
    if (req.query.isActive) query.isActive = req.query.isActive;
    if (req.query.property_type) query.property_type = req.query.property_type;
    if (req.query.serviceType) query.serviceType = req.query.serviceType;
    if (req.query.demand) query.demand = req.query.demand;
    if (req.query.category) query.category = req.query.category;

    // If not root admin, only show properties added by the user
    if (!isAdmin) {
      query.addedBy = req.user.id;
    }

    const properties = await Property.find(query)
      .populate('category', 'name')
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(properties);
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


exports.updatePropertyStatus = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { status, approvalStatus } = req.body;
    const adminId = req.user.id; 

    const property = await Property.findById(propertyId);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    // Update property status
    if (status) {
      property.isActive = status;
    }

    // Update approval status if provided
    if (approvalStatus) {
      property.approvalStatus = approvalStatus;
      property.approvedBy = adminId;
      property.approvedAt = new Date();
    }

    await property.save();

    res.status(200).json({
      success: true,
      message: "Property status updated successfully",
      data: property
    });

  } catch (error) {
    console.error('Error updating property status:', error);
    res.status(500).json({
      success: false,
      message: "Error updating property status",
      error: error.message
    });
  }
};

