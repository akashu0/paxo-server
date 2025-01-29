const MonthlyPayout = require('../models//monthlypayout');

exports.getPayoutSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();

    // Get all active payouts for the user
    const payouts = await MonthlyPayout.find({
      user: userId,
      isActive: "active",
    }).populate({
      path: 'order',
      select: 'orderNumber property',
      populate: {
        path: 'property',
        select: 'property_name property_type'
      }
    });

    let totalPaidAmount = 0;
    let totalPendingAmount = 0;
    let nextPayoutTotal = 0;
    let nearestPaymentDate = null;

    // Helper function to compare dates ignoring time
    const isSameDay = (date1, date2) => {
      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
    };

    // First find the nearest payment date across all payouts
    payouts.forEach(payout => {
      payout.payment_structure.forEach(payment => {
        const paymentDate = new Date(payment.next_payment);
        if (paymentDate >= currentDate) {
          if (!nearestPaymentDate || paymentDate < nearestPaymentDate) {
            nearestPaymentDate = paymentDate;
          }
        }
      });
    });

    // Then calculate totals including the next payout total
    payouts.forEach(payout => {
      payout.payment_structure.forEach(payment => {
        if (payment.status === "paid") {
          totalPaidAmount += Number(payment.paid_amount);
        } else {
          totalPendingAmount += Number(payment.expected_amount);
          
          // Compare dates ignoring time component
          const paymentDate = new Date(payment.next_payment);
          if (nearestPaymentDate && isSameDay(paymentDate, nearestPaymentDate)) {
            nextPayoutTotal += Number(payment.expected_amount);
          }
        }
      });
    });

    res.json({
      success: true,
      data: {
        nextPayoutDate: nearestPaymentDate,
        nextPayoutTotal: nextPayoutTotal.toFixed(2),
        totalPaidAmount: totalPaidAmount.toFixed(2),
        totalPendingAmount: totalPendingAmount.toFixed(2)
      }
    });

  } catch (error) {
    console.error('Get Payout Summary Error:', error);
    res.status(500).json({
      success: false,
      message: "Error retrieving payout summary",
      error: error.message
    });
  }
};
  
  // Get payout history with pagination
  exports.getPayoutHistory = async (req, res) => {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
  
      // Get all active payouts
      const payouts = await MonthlyPayout.find({
        user: userId,
        isActive: "active"
      }).populate({
        path: 'order',
        select: 'orderNumber property',
        populate: {
          path: 'property',
          select: 'title propertyType'
        }
      });
  
      // Extract all paid payments
      let paidPayments = [];
      payouts.forEach(payout => {
        const paidFromThisPayout = payout.payment_structure
          .filter(payment => payment.status === "paid")
          .map(payment => ({
            paymentDate: payment.transaction_details.processedAt,
            propertyTitle: payout.order.property?.title || 'N/A',
            propertyType: payout.order.property?.propertyType || 'N/A',
            orderNumber: payout.order.orderNumber,
            paidAmount: payment.paid_amount,
            transactionId: payment.transaction_details.transactionId,
            paymentMethod: payment.transaction_details.paymentMethod,
            receiptUrl: payment.receipt_url,
            remarks: payment.transaction_details.remarks || ''
          }));
        paidPayments = [...paidPayments, ...paidFromThisPayout];
      });
  
      // Sort by payment date in descending order
      paidPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
  
      // Apply pagination
      const totalPayments = paidPayments.length;
      const paginatedPayments = paidPayments.slice(skip, skip + Number(limit));
  
      res.json({
        success: true,
        data: {
          payments: paginatedPayments,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(totalPayments / limit),
            totalItems: totalPayments,
            hasNextPage: skip + Number(limit) < totalPayments,
            hasPreviousPage: page > 1
          }
        }
      });
  
    } catch (error) {
      console.error('Get Payout History Error:', error);
      res.status(500).json({
        success: false,
        message: "Error retrieving payout history",
        error: error.message
      });
    }
  };
  