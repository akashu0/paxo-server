const express = require("express");
const router = express.Router();
const formController = require("../controllers/formController");

router.post("/submit", formController.submitForm);
router.get("/submissions", formController.getAllSubmissions);
router.get("/submissions/:serviceType", formController.getSubmissionsByService);

module.exports = router;
