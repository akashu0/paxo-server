const express = require("express");
const router = express.Router();
const formController = require("../controllers/formController");
const niftiController = require("../controllers/niftibookingController");

router.post("/submit", formController.submitForm);
router.get("/get-submissions", formController.getAllSubmissions);
router.get("/submissions/:serviceType", formController.getSubmissionsByService);

router.post('/bookings', niftiController.createBooking);
router.get('/available-slots', niftiController.getAvailableTimeSlots);
router.get('/available-dates', niftiController.getAvailableDatesForMonth);


// Admin routes (protected)
router.get('/bookings',  niftiController.getBookings);
router.get('/bookings/:id',  niftiController.getBooking);
router.patch('/bookings/:id/status', niftiController.updateBookingStatus);

module.exports = router;
