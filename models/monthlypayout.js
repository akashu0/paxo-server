const mongoose = require("mongoose");

// Helper function to calculate next payment date (5th of next month)
function getNextFifthDate(previousDate) {
  const date = new Date(previousDate);
  date.setMonth(date.getMonth() + 1);
  date.setDate(5);
  return date;
}

const monthlyPayoutSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    baseAmount: {
      type: String,
      required: true
    },
    totalMonths: {
      type: String,
      default: "18"
    },
    payment_structure: [{
      previous_payment: {
        type: Date,
        default: Date.now
      },
      next_payment: {
        type: Date,
        default: function() {
          return getNextFifthDate(this.previous_payment);
        }
      },
      paid_amount: {
        type: String,
        default: "0"
      },
      status: {
        type: String,
        enum: ["paid", "unpaid"],
        default: "unpaid"
      },
      transaction_details: {
        transactionId: { type: String },
        paymentMethod: { type: String },
        processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        processedAt: { type: Date },
        remarks: { type: String }
      },
      receipt_url: { type: String }
    }],
    isActive: {
      type: String,
      enum: ["active", "inactive", "deleted"],
      default: "active"
    }
  },
  { timestamps: true }
);

// Pre-save middleware to initialize payment structure for 18 months
monthlyPayoutSchema.pre('save', function(next) {
  if (this.isNew) {
    const startDate = new Date(this.startDate);
    let currentDate = new Date(startDate);
    currentDate.setDate(5); // Set to 5th of the month

    // Initialize payment structure for 18 months
    this.payment_structure = Array.from({ length: 18 }, () => {
      const payment = {
        previous_payment: new Date(currentDate),
        next_payment: getNextFifthDate(currentDate),
        paid_amount: "0",
        status: "unpaid",
      };
      currentDate = new Date(payment.next_payment);
      return payment;
    });

    // Set end date to 18 months from start
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 18);
    this.endDate = endDate;
  }
  next();
});

// Method to calculate next month's payout amount
monthlyPayoutSchema.methods.calculateNextPayout = function() {
  const currentPayment = this.payment_structure.find(p => p.status === "unpaid");
  if (currentPayment) {
    const principal = Number(this.baseAmount);
    const rate = Number(currentPayment.capital_appreciation.rate);
    const monthlyInterest = (principal * rate) / 1200;
    return String(monthlyInterest.toFixed(2));
  }
  return "0";
};

// Method to update payment status
monthlyPayoutSchema.methods.markPaymentAsPaid = async function(paymentIndex, transactionDetails) {
  if (this.payment_structure[paymentIndex]) {
    const payment = this.payment_structure[paymentIndex];
    payment.status = "paid";
    payment.paid_amount = this.calculateNextPayout();
    payment.transaction_details = {
      ...transactionDetails,
      processedAt: new Date()
    };
    await this.save();
    return true;
  }
  return false;
};

// Static method to get all pending payments for current month
monthlyPayoutSchema.statics.getPendingPayments = async function() {
  const currentDate = new Date();
  currentDate.setDate(5); // 5th of current month

  return this.find({
    isActive: "active",
    "payment_structure": {
      $elemMatch: {
        status: "unpaid",
        next_payment: {
          $lte: currentDate
        }
      }
    }
  }).populate('user order');
};

// Static method to get upcoming payments
monthlyPayoutSchema.statics.getUpcomingPayments = async function(userId) {
  const query = { isActive: "active" };
  if (userId) {
    query.user = userId;
  }

  return this.find(query)
    .populate('user order')
    .sort('payment_structure.next_payment');
};

const MonthlyPayout = mongoose.model("MonthlyPayout", monthlyPayoutSchema);
module.exports = MonthlyPayout;