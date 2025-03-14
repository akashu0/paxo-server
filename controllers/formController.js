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
    const submissions = await FormSubmission.find();
    res.status(200).json(submissions);
  } catch (error) {
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
