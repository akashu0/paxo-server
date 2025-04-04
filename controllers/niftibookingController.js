const Booking = require('../models/niftiBooking');

// Get available time slots for a specific date
exports.getAvailableTimeSlots = async (req, res) => {
    try {
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ 
          success: false, 
          error: 'Date parameter is required' 
        });
      }
      
      const bookingDate = new Date(date);
      
      // Check if date is valid
      if (isNaN(bookingDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid date format' 
        });
      }
      
      // Check for special date ranges
      const april6th2025 = new Date(2025, 3, 6); // April 6th, 2025 (launch date)
      const april25th2025 = new Date(2025, 3, 25); // April 25th, 2025 (first available date)
      
      // Handle dates before April 6th
      if (bookingDate < april6th2025) {
        return res.status(200).json({
          success: true,
          data: {
            date: bookingDate,
            isAvailable: false,
            message: "Booking system opens on April 6th, 2025",
            availableTimeSlots: []
          }
        });
      }
      
      // Handle dates between April 6th and April 24th (all booked)
      if (bookingDate >= april6th2025 && bookingDate < april25th2025) {
        return res.status(200).json({
          success: true,
          data: {
            date: bookingDate,
            isAvailable: false,
            message: "All dates until April 25th, 2025 are fully booked",
            availableTimeSlots: []
          }
        });
      }
      
      // For dates on or after April 25th, check actual booking count
      const isAvailable = await Booking.isDateAvailable(bookingDate);
      const bookingCount = await Booking.countBookingsForDate(bookingDate);
      
      // Get available time slots (will be empty if date is not available)
      const availableTimeSlots = isAvailable ? await Booking.getAvailableTimeSlots(bookingDate) : [];
      
      return res.status(200).json({
        success: true,
        data: {
          date: bookingDate,
          isAvailable: isAvailable,
          bookingCount: bookingCount,
          availableTimeSlots: availableTimeSlots,
          remainingSlots: 10 - bookingCount
        }
      });
    } catch (error) {
      console.error('Error getting available time slots:', error);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  };
  
  // Get available dates for a month
  exports.getAvailableDatesForMonth = async (req, res) => {
    try {
      const { year, month } = req.query;
      
      if (!year || !month) {
        return res.status(400).json({
          success: false,
          error: 'Year and month parameters are required'
        });
      }
      
      const numYear = parseInt(year);
      const numMonth = parseInt(month);
      
      if (isNaN(numYear) || isNaN(numMonth) || numMonth < 1 || numMonth > 12) {
        return res.status(400).json({
          success: false,
          error: 'Invalid year or month format'
        });
      }
      
      // Special handling for dates
      const april6th2025 = new Date(2025, 3, 6); // April 6th, 2025 (launch date)
      const april25th2025 = new Date(2025, 3, 25); // April 25th, 2025 (first available date)
      
      // Create start and end dates for the requested month
      const startDate = new Date(numYear, numMonth - 1, 1); // Month is 0-indexed in JS Date
      const endDate = new Date(numYear, numMonth, 0); // Last day of the month
      
      // If the entire month is before April 6th, 2025, return no available dates
      if (endDate < april6th2025) {
        return res.status(200).json({
          success: true,
          data: {
            year: numYear,
            month: numMonth,
            availableDates: []
          }
        });
      }
      
      // If the entire month is in the booked period (before April 25th, 2025)
      if (endDate < april25th2025) {
        return res.status(200).json({
          success: true,
          data: {
            year: numYear,
            month: numMonth,
            availableDates: []
          }
        });
      }
      
      // For months including or after April 25th, 2025
      let availableDates = [];
      
      // If the month includes April 25th, manually add days from April 25th to end of month
      if (numYear === 2025 && numMonth === 4) { // April is month 4
        // Get all dates from April 25th to end of month
        for (let day = 25; day <= endDate.getDate(); day++) {
          const date = new Date(2025, 3, day);
          const isAvailable = await Booking.isDateAvailable(date);
          
          if (isAvailable) {
            const dateStr = date.toISOString().split('T')[0];
            availableDates.push(dateStr);
          }
        }
      } else if (startDate >= april25th2025) {
        // For months fully after April 25th, 2025, get available dates normally
        availableDates = await Booking.getAvailableDatesForMonth(numYear, numMonth);
      } else {
        // For months that span across April 25th, get available dates only for days after April 25th
        const daysInMonth = endDate.getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(numYear, numMonth - 1, day);
          
          if (date >= april25th2025) {
            const isAvailable = await Booking.isDateAvailable(date);
            
            if (isAvailable) {
              const dateStr = date.toISOString().split('T')[0];
              availableDates.push(dateStr);
            }
          }
        }
      }
      
      return res.status(200).json({
        success: true,
        data: {
          year: numYear,
          month: numMonth,
          availableDates
        }
      });
    } catch (error) {
      console.error('Error getting available dates:', error);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  };
  // Create a new booking
  exports.createBooking = async (req, res) => {
    try {
      const {
        fullName,
        mobileNumber,
        email,
        city,
        vehicleType,
        preferredModel,
        rentalPlan,
        bookingDate,
        bookingTime
      } = req.body;
      
      // Validate required fields manually for clearer errors
      const requiredFields = ['fullName', 'mobileNumber', 'city', 'vehicleType', 
                             'preferredModel', 'rentalPlan', 'bookingDate', 'bookingTime'];
      
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            success: false,
            error: `${field} is required`
          });
        }
      }
      
      // Parse the booking date
      const parsedBookingDate = new Date(bookingDate);
      
      // Check for past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsedBookingDate < today) {
        return res.status(400).json({
          success: false,
          error: 'Booking date cannot be in the past'
        });
      }
      
      // Check if the date is available (less than 10 total bookings)
      const isDateAvailable = await Booking.isDateAvailable(parsedBookingDate);
      
      if (!isDateAvailable) {
        return res.status(400).json({
          success: false,
          error: 'This date is fully booked. Please select another date.'
        });
      }
      
      // Create the booking
      const booking = new Booking({
        fullName,
        mobileNumber,
        email,
        city,
        vehicleType,
        preferredModel,
        rentalPlan,
        bookingDate: parsedBookingDate,
        bookingTime
      });
      
      await booking.save();
      
      // After saving, check the updated booking count for this date
      const updatedBookingCount = await Booking.countBookingsForDate(parsedBookingDate);
      const remainingSlots = 10 - updatedBookingCount;
      
      return res.status(201).json({
        success: true,
        data: booking,
        meta: {
          bookingCount: updatedBookingCount,
          remainingSlots: remainingSlots,
          isFullyBooked: remainingSlots <= 0
        }
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: validationErrors.join(', ')
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  };

// Get all bookings (with optional filters - for admin use)
exports.getBookings = async (req, res) => {
  try {
    const { status, date, vehicleType } = req.query;
    const filter = {};
    
    // Apply filters if provided
    if (status) filter.status = status;
    if (vehicleType) filter.vehicleType = vehicleType;
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      filter.bookingDate = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }
    
    const bookings = await Booking.find(filter).sort({ bookingDate: 1, bookingTime: 1 });
    
    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get a single booking by ID
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};