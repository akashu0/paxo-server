const mongoose = require("mongoose");

// Helper function to calculate next payment date (10th of next month)
function getNextTenthDate(previousDate) {
  const date = new Date(previousDate);
  date.setMonth(date.getMonth() + 1);
  date.setDate(10);
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
    totalAmount: {
      amount: {
        type: String,
        required: true,
      },
      taxes: {
        type: String,
        required: true,
      },
    },
    totalMonths: {
      type: String,
      default: "12"
    },
    capitalAppreciation: {
      type: String,
      required: true
    },
    appreciatedValue: {
      type: String,
    },
    payment_structure: [{
      previous_payment: {
        type: Date,
        default: null
      },
      next_payment: {
        type: Date,
        default: function () {
          return getNextTenthDate(this.previous_payment || new Date());
        }
      },
      paid_amount: {
        type: String,
        default: "0"
      },
      expected_amount: {
        type: String,
        required: true
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

// Pre-save middleware to initialize payment structure for 12 months
monthlyPayoutSchema.pre('save', function (next) {
  if (this.isNew) {
    // Calculate appreciated value
    const baseAmount = Number(this.totalAmount.amount);
    const appreciationRate = Number(this.capitalAppreciation);
    this.appreciatedValue = String((baseAmount * appreciationRate / 100).toFixed(2));

    // Calculate monthly payment amount including taxes
    const monthlyPayment = this.capitalAppreciation ?
      Math.ceil(((appreciationRate / 100) * baseAmount) / 12) : 0;

    const startDate = new Date(this.startDate);
    let currentDate = new Date(startDate);
    currentDate.setDate(10); // Set to 10th of the month

    // Initialize payment structure for 12 months
    this.payment_structure = Array.from({ length: 12 }, (_, index) => {
      const payment = {
        previous_payment: index === 0 ? null : new Date(currentDate),
        next_payment: getNextTenthDate(currentDate),
        paid_amount: "0",
        expected_amount: monthlyPayment,
        status: "unpaid",
      };
      currentDate = new Date(payment.next_payment);
      return payment;
    });

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 12);
    this.endDate = endDate;
  }
  next();
});

// Method to calculate the next unpaid expected amount
monthlyPayoutSchema.methods.calculateNextPayout = function () {
  const currentPayment = this.payment_structure.find(p => p.status === "unpaid");
  if (currentPayment) {
    return currentPayment.expected_amount;
  }
  return "0";
};

// Method to mark a payment as paid
monthlyPayoutSchema.methods.markPaymentAsPaid = async function (paymentIndex, transactionDetails) {
  if (this.payment_structure[paymentIndex]) {
    const payment = this.payment_structure[paymentIndex];
    payment.status = "paid";
    payment.paid_amount = payment.expected_amount;
    payment.transaction_details = {
      ...transactionDetails,
      processedAt: new Date()
    };

    if (this.payment_structure[paymentIndex + 1]) {
      this.payment_structure[paymentIndex + 1].previous_payment = new Date();
    }

    await this.save();
    return true;
  }
  return false;
};

// Static method to get pending payments (due on or before 10th of current month)
monthlyPayoutSchema.statics.getPendingPayments = async function () {
  const currentDate = new Date();
  currentDate.setDate(10);

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

// Static method to get upcoming payments for a user (sorted by next_payment date)
monthlyPayoutSchema.statics.getUpcomingPayments = async function (userId) {
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
