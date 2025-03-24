const FormSubmission = require("../models/FormSubmission");

// Submit form data
exports.submitForm = async (req, res) => {
  try {
    const { name, phone, email, address, message, interested, serviceType } = req.body;

    if (!name || !phone || !email || !address || !serviceType) {
      return res.status(400).json({ error: "All required fields must be filled" });
    }

    const newSubmission = new FormSubmission({ name, phone, email, address, message, interested, serviceType });

    await newSubmission.save();
    res.status(201).json({ message: "Form submitted successfully", data: newSubmission });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Get all submissions
exports.getAllSubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 10, serviceType, interested, search } = req.query;
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Calculate skip value for pagination
    const skip = (pageNum - 1) * limitNum;
    
    // Build query filters
    const query = {};
    
    // Add serviceType filter if provided
    if (serviceType && serviceType !== 'all') {
      query.serviceType = serviceType;
    }
    
    // Add interested filter if provided
    if (interested && interested !== 'all') {
      query.interested = interested;
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const submissions = await FormSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    // Get total count for pagination
    const totalCount = await FormSubmission.countDocuments(query);
    
    // Get statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // These can be optimized with aggregation in a production environment
    const statistics = {
      totalCount,
      niftiLand: await FormSubmission.countDocuments({ serviceType: 'NiftiLand' }),
      niftiRide: await FormSubmission.countDocuments({ serviceType: 'NiftiRide' }),
      properties: await FormSubmission.countDocuments({ interested: 'Properties' }),
      ride: await FormSubmission.countDocuments({ interested: 'Ride' }),
      today: await FormSubmission.countDocuments({
        createdAt: { $gte: today }
      })
    };
    
    res.status(200).json({
      submissions,
      totalCount,
      statistics,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum)
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Get submissions by service type
exports.getSubmissionsByService = async (req, res) => {
  try {
    const { serviceType } = req.params;
    const submissions = await FormSubmission.find({ serviceType });

    if (!submissions.length) {
      return res.status(404).json({ message: `No submissions found for ${serviceType}` });
    }

    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
