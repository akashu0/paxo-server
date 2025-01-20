const MonthlyPayout = require('../models//monthlypayout');

exports.getPayoutSummary = async (req, res) => {
    try {
      const userId = req.user.id;
      const currentDate = new Date();

      
  
      // Get all active payouts for the user
      const payouts = await MonthlyPayout.find({
        user: userId,
        isActive: "active",
        // Find payouts that have unpaid payments with next_payment date
        'payment_structure': {
          $elemMatch: {
            status: "unpaid"
          }
        }
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
      let nextPayout = null;
  
      // Find the next upcoming payment across all payouts
      let nearestPaymentDate = null;
      let nearestPayment = null;
      let nearestPayout = null;
  
      payouts.forEach(payout => {
        // Calculate totals
        payout.payment_structure.forEach(payment => {
          if (payment.status === "paid") {
            totalPaidAmount += Number(payment.paid_amount);
          } else {
            totalPendingAmount += Number(payment.expected_amount);
  
            // Check if this is the next upcoming payment
            const paymentDate = new Date(payment.next_payment);
            if (paymentDate >= currentDate) {
              if (!nearestPaymentDate || paymentDate < nearestPaymentDate) {
                nearestPaymentDate = paymentDate;
                nearestPayment = payment;
                nearestPayout = payout;
              }
            }
          }
        });
      });
  
      // Set next payout if found
      if (nearestPayment && nearestPayout) {
        nextPayout = {
          dueDate: nearestPayment.next_payment,
          estimatedAmount: nearestPayment.expected_amount,
          previousPaymentDate: nearestPayment.previous_payment,
          propertyTitle: nearestPayout.order.property?.title || 'N/A',
          orderNumber: nearestPayout.order.orderNumber
        };
      }
  
      res.json({
        success: true,
        data: {
          nextPayout,
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
  