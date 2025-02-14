const Order = require("../models/order");
const MonthlyPayout = require('../models/monthlypayout');
const LegalDocument = require('../models/legalDocument');
const Property = require("../models/property")
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const receiptService = require('../services/receiptService');

exports.createOrder = async (req, res) => {
  
  try {
    const { 
      propertyId, 
      quantity, 
      paymentMethod, 
      paidAmount,
      transactionId,
      paymentDate,
    } = req.body;


    
  
    

    // Validate property exists and has enough units
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (Number(quantity) > Number(property.available_unit)) {
      return res.status(400).json({ message: 'Not enough units available' });
    }

    const paymentProofPath = req.file ? req.file.path : '';

    const order = new Order({
      property: propertyId,
      user: req.user.id, 
      units:quantity,
      paymentDetails: {
        method: paymentMethod,
        paidAmount,
        transactionId,
        paymentDate,
        paymentProof: paymentProofPath
      },
    });

    await order.save();

    res.status(201).json({
      message: 'Order created successfully',
      success: "ok"
      // order
    });

  } catch (error) {
    console.log(error.message);
    
    res.status(500).json({
      message: 'Error creating order',
      error: error.message
    });
  }
};


// exports.createOrder = async (req, res) => {
//   try {
//     const { 
//       propertyId, 
//       quantity,   
//       paymentMethod, 
//       totalAmount 
//     } = req.body;


// console.log(propertyId);
// console.log(paymentMethod);

//     // Validate if the property exists
//     const property = await Property.findById(propertyId);
//     if (!property) {
//       return res.status(404).json({ message: 'Property not found' });
//     }

//     // Validate if enough units are available
//     if (Number(quantity) > Number(property.available_unit)) {
//       return res.status(400).json({ message: 'Not enough units available' });
//     }

//     // Find the highest bidder in capital_appreciation
//     let highestBid = null;
//     if (property.capital_appreciation && property.capital_appreciation.length > 0) {
//       highestBid = property.capital_appreciation.reduce((max, bid) => 
//         bid.value > (max?.value || 0) ? bid : max, null);
//     }

//     // Create and save the order
//     const order = new Order({
//       property: propertyId,
//       user: req.user.id, 
//       units: quantity,  // Storing as "units"
//       paymentDetails: {
//         method: paymentMethod,
//         paidAmount: totalAmount,
//       },
//       capitalAppreciation: highestBid 
//         ? {
//             value: highestBid.value,
//             prelistedBuyerId: highestBid.prlistedBuyer, // Buyer ID from the highest bid
//           }
//         : null, // No bids available
//     });

//     await order.save();

//     res.status(201).json({
//       message: 'Order created successfully',
//       success: "ok"
//     });

//   } catch (error) {
//     console.log("Error:", error.message);
//     res.status(500).json({
//       message: 'Error creating order',
//       error: error.message
//     });
//   }
// };




exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch completed user orders where both orderStatus and paymentStatus are "completed"
    const orders = await Order.find({
      user: userId,
    })
      .sort({ createdAt: -1 })
      .populate("property");

    // Calculate total investment (sum of baseAmount from priceDetails)
    const totalInvestment = orders.reduce((sum, order) => {
      return sum + (Number(order.priceDetails?.baseAmount) || 0);
    }, 0);

    // Respond with user's orders and total investment
    res.status(200).json({
      success: true,
      totalInvestment,
      orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



exports.getConfirmedUserOrders = async (req, res) => {
  try {
    // Get user ID from the verified token (userVerify middleware should set `req.user`)
    const userId = req.user.id;

    // Fetch orders where orderStatus is 'confirmed' and paymentStatus is 'completed'
    const orders = await Order.find({
      user: userId,
      orderStatus: 'confirmed',
      paymentStatus: 'completed',
    }).sort({ createdAt: -1 }).populate("property")

    // Respond with the filtered orders
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



exports.getAllOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      status,
      startDate,
      endDate,
      search 
    } = req.query;

    const query = {};

    // Add filters if provided
    if (status) query.orderStatus = status;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'property.property_name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, totalOrders, stats] = await Promise.all([
      Order.find(query)
        .populate('user', 'username email phone')
        .populate('property', 'property_name property_unit_price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      
      Order.countDocuments(query),

      // Get order statistics
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalAmount: { $sum: { $toDouble: "$totalAmount" } },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ["$orderStatus", "pending"] }, 1, 0] }
            },
            confirmedOrders: {
              $sum: { $cond: [{ $eq: ["$orderStatus", "confirmed"] }, 1, 0] }
            },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      orders,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats: stats[0] || {
        totalOrders: 0,
        totalAmount: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        cancelledOrders: 0
      }
    });

  } catch (error) {
    console.error('Error in getAllOrders:', error);
    res.status(500).json({
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('property')
      .populate('user', 'username email phone')
      .populate('paymentDetails.verifiedBy', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching order',
      error: error.message
    });
  }
};


exports.verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { verificationStatus, verificationNotes } = req.body;

    const order = await Order.findById(orderId).populate('property');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });

      
    }


    order.paymentDetails.verificationStatus = verificationStatus;
    order.paymentDetails.verificationNotes = verificationNotes;
    order.paymentDetails.verifiedBy = req.user._id;
    order.paymentDetails.verificationDate = new Date().toISOString();

    if (verificationStatus === 'verified') {
      order.orderStatus = 'confirmed';
      order.paymentStatus = 'completed';

      // Initialize Monthly Payout Schedule
      const payout = new MonthlyPayout({
        order: order._id,
        user: order.user,
        startDate: new Date(),
        totalAmount: {
          amount: order.priceDetails.baseAmount,
          taxes: order.priceDetails.taxAmount,      
        },

        capitalAppreciation:order.property.capital_appreciation,
        payment_structure: [] 
      });
      await payout.save();

      // Initialize Legal Document
      const legalDoc = new LegalDocument({
        order: order._id,
        user: order.user,
        property: order.property._id,
        documentStatus: 'pending',
        documentFiles: [],
      });
      await legalDoc.save();

      // Reduce available units in property
      if (order.property) {
        order.property.available_unit = String(
          Number(order.property.available_unit) - Number(order.units)
        );
        await order.property.save();
      }

    } else if (verificationStatus === 'rejected') {
      order.orderStatus = 'cancelled';
    }

    await order.save();

    res.json({
      message: 'Payment verification updated successfully',
      order,
      payout: verificationStatus === 'verified' ? {
        message: 'Monthly payout schedule initialized',
        startDate: new Date(),
        totalMonths: '18'
      } : null,
      legalStatus: verificationStatus === 'verified' ? {
        message: 'Legal documentation process initiated',
        status: 'pending'
      } : null
    });

  } catch (error) {
    // If any error occurs, attempt to rollback changes
    console.error('Verification Error:', error);
    res.status(500).json({
      message: 'Error verifying payment',
      error: error.message
    });
  }
};


exports.downloadPaymentSlip = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order and populate necessary fields
    const order = await Order.findById(orderId)
      .populate('property', 'property_name property_location property_unit_price')
      .populate('user', 'username email');

    // Validation checks
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.orderStatus !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: "Payment slip is only available for confirmed orders"
      });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payment-slip-${orderId}.pdf`);

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add company logo or header
    doc.fontSize(20).text('Payment Slip', { align: 'center' });
    doc.moveDown();

    // Add order details
    doc.fontSize(12);
    doc.text(`Order ID: ${order._id}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    // Customer details
    doc.fontSize(14).text('Customer Details', { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${order.user.username}`);
    doc.text(`Email: ${order.user.email}`);
    doc.moveDown();

    // Property details
    doc.fontSize(14).text('Property Details', { underline: true });
    doc.fontSize(12);
    doc.text(`Property: ${order.property.property_name}`);
    doc.text(`Location: ${order.property.property_location}`);
    doc.text(`Units: ${order.units}`);
    doc.moveDown();

    // Payment details
    doc.fontSize(14).text('Payment Details', { underline: true });
    doc.fontSize(12);
    doc.text(`Payment Method: ${order.paymentDetails.method}`);
    doc.text(`Transaction ID: ${order.paymentDetails.transactionId}`);
    doc.text(`Payment Date: ${order.paymentDetails.paymentDate}`);
    doc.text(`Paid Amount: ${order.paymentDetails.paidAmount}`);
    doc.moveDown();

    // Price breakdown
    doc.fontSize(14).text('Price Breakdown', { underline: true });
    doc.fontSize(12);
    doc.text(`Total Area: ${order.priceDetails.totalArea} sq ft`);
    doc.text(`Base Amount: ${order.priceDetails.baseAmount}`);
    doc.text(`Tax Amount: ${order.priceDetails.taxAmount}`);
    doc.text(`Total Amount: ${order.totalAmount}`);
    doc.text(`Monthly Earnings: ${order.priceDetails.monthlyEarnings}`);
    doc.text(`Capital Appreciation: ${order.priceDetails.capitalAppreciation}`);
    doc.moveDown();

    // Add payment proof image if exists
    if (order.paymentDetails.paymentProof) {
      doc.addPage();
      doc.fontSize(14).text('Payment Proof', { underline: true });
      try {
        doc.image(order.paymentDetails.paymentProof, {
          fit: [500, 700],
          align: 'center'
        });
      } catch (error) {
        console.error('Error adding payment proof image:', error);
      }
    }

    // Finalize the PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: "Error generating PDF",
      error: error.message
    });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order first to get file path
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }

 

    // Get the payment proof file path
    const paymentProofPath = order.paymentDetails.paymentProof;

    // Delete the file if it exists
    if (paymentProofPath) {
      const fullPath = path.join(__dirname, '..', paymentProofPath);
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continue with order deletion even if file deletion fails
      }
    }

    // Update property available units
    await Property.findByIdAndUpdate(
      order.property,
      { $inc: { available_unit: order.units } },
      { new: true }
    );

    // Delete the order from database
    await Order.findByIdAndDelete(orderId);

    res.status(200).json({
      message: 'Order deleted successfully',
      success: true
    });

  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      message: 'Error deleting order',
      error: error.message
    });
  }
};

/**
 * @route GET /api/orders/:orderId/receipt
 * @description Generate and download payment receipt for a verified order
 * @access Private
 */
exports.downloadOrderPaymentSlip = async (req, res) => {
  try {
    // Find the order and populate necessary fields
    const order = await Order.findById(req.params.orderId)
      .populate('property')
      .populate('user');

    // Check if order exists
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify order status and payment
    if (order.paymentStatus !== 'completed' || 
        order.paymentDetails.verificationStatus !== 'verified') {
      return res.status(400).json({ 
        message: 'Receipt is only available for verified and completed payments' 
      });
    }

    // Get logo from request
    const logoData = req.body.logo ;

    // Prepare data for the receipt
    const receiptData = {
      orderId: order._id,
      customerName: order.user.username,
      customerEmail: order.user.email,
      customerPhone: order.user.phone,
      propertyName: order.property.property_name,
      propertyType: order.property.property_type,
      location: order.property.property_location,
      capitalAppreciation: order.property.capital_appreciation,
      monthlyEarnings: order.priceDetails.monthlyEarnings,
      totalAmount: order.totalAmount,
      baseAmount: order.priceDetails.baseAmount,
      taxAmount: order.priceDetails.taxAmount,
      paymentMethod: order.paymentDetails.method,
      transactionId: order.paymentDetails.transactionId,
      logoData: logoData
    };

    // Generate PDF
    const pdfBuffer = await receiptService.generateReceipt(receiptData);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition', 
      `attachment; filename=receipt-PW-${order._id.toString().slice(-6).toUpperCase()}.pdf`
    );

    // Send PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({ 
      message: 'Error generating receipt', 
      error: error.message 
    });
  }
};

