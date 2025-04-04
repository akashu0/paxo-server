// models/Booking.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for bookings
const bookingSchema = new Schema({
  // Personal details
  fullName: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v); // Validate Indian mobile numbers (10 digits)
      },
      message: props => `${props.value} is not a valid mobile number!`
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return v === '' || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  
  // Vehicle selection
  vehicleType: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: ['EV Auto', 'EV Car', 'EV Luxury Car']
  },
  preferredModel: {
    type: String,
    required: [true, 'Preferred model is required'],
    trim: true
  },
  rentalPlan: {
    type: String,
    required: [true, 'Rental plan is required'],
    enum: ['Daily', 'Weekly', 'Monthly', 'Fractional Ownership']
  },
  
  // Booking details
  bookingDate: {
    type: Date,
    required: [true, 'Booking date is required'],
    validate: {
      validator: function(v) {
        return v >= new Date(new Date().setHours(0, 0, 0, 0)); // Must be today or future date
      },
      message: props => `Booking date cannot be in the past!`
    }
  },
  bookingTime: {
    type: String,
    required: [true, 'Booking time is required'],
    trim: true
  },
  
  // Additional fields for system tracking
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add pre-save middleware to update the 'updatedAt' field
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Function to get a standardized date string (YYYY-MM-DD)
const getDateString = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

// Add a method to count bookings for a specific date
bookingSchema.statics.countBookingsForDate = async function(date) {
  const startOfDay = new Date(new Date(date).setHours(0, 0, 0, 0));
  const endOfDay = new Date(new Date(date).setHours(23, 59, 59, 999));
  
  return this.countDocuments({
    bookingDate: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $ne: 'cancelled' } // Exclude cancelled bookings
  });
};

// Add a method to check if a time slot is available
bookingSchema.statics.isTimeSlotAvailable = async function(date, time) {
  // Check if the date already has 10 bookings
  const bookingCount = await this.countBookingsForDate(date);
  return bookingCount < 10;
};

// Add a method to check if a date is available (has less than 10 total bookings)
bookingSchema.statics.isDateAvailable = async function(date) {
  const bookingCount = await this.countBookingsForDate(date);
  return bookingCount < 10;
};

// Add a method to get available dates for a month
bookingSchema.statics.getAvailableDatesForMonth = async function(year, month) {
  // Create start and end dates for the month
  const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in JS Date
  const endDate = new Date(year, month, 0); // Last day of the month
  
  // Get all dates in the month
  const daysInMonth = endDate.getDate();
  const allDates = [];
  const availableDates = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    allDates.push(date);
  }

  // Check each date for availability
  for (const date of allDates) {
    // Skip dates before April 25, 2025
    const april25th2025 = new Date(2025, 3, 25); // Month is 0-indexed
    if (date < april25th2025) continue;

    const bookingCount = await this.countBookingsForDate(date);
    if (bookingCount < 10) {
      availableDates.push(getDateString(date));
    }
  }
  
  return availableDates;
};

// Add a method to get available time slots for a date
bookingSchema.statics.getAvailableTimeSlots = async function(date) {
  // First check if the date is available (less than 10 bookings)
  const isAvailable = await this.isDateAvailable(date);
  
  if (!isAvailable) {
    return []; // No available time slots if date is fully booked
  }
  
  // Define the time slots from 11 AM to 5 PM
  return ["11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];
};

module.exports = mongoose.model('niftiBooking', bookingSchema);