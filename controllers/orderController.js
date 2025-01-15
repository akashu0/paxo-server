const Order = require("../models/order");
const MonthlyPayout = require('../models/monthlypayout');
const LegalDocument = require('../models/legalDocument');
const Property = require("../models/property")


exports.createOrder = async (req, res) => {
  
  try {
    const { 
      propertyId, 
      units, 
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

    if (Number(units) > Number(property.available_unit)) {
      return res.status(400).json({ message: 'Not enough units available' });
    }

    const paymentProofPath = req.file ? req.file.path : '';

    const order = new Order({
      property: propertyId,
      user: req.user.id, 
      units,
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



exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user's orders from the database
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).populate("property")

    // Respond with the user's orders
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
    }).sort({ createdAt: -1 });

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
        baseAmount: order.totalAmount,
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


