const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const generatePaymentId = () => {
  const randomNum = Math.floor(Math.random() * 1000000);
  return `PXERN${randomNum}`;
};

const getNextFifthDate = (date) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(5);
  return result;
};

const portfolioSchema = new Schema({
  order_id: {
    type: Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  appreciated_value: {
    type: Number,
    required: true,
  },
  invested_amount: {
    type: Number,
    required: true,
  },
  net_profit: {
    type: Number,
    required: true,
  },
  prelisted_buyer: {
    type: String,
    required: true,
  },
  buyer_appreciated_value: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  payment_id: {
    type: String,
    unique: true,
    required: true,
  },
  payment_structure: [
    {
      previous_payment: {
        type: Date,
        default: Date.now,
      },
      next_payment: {
        type: Date,
        default: function () {
          return getNextFifthDate(this.previous_payment);
        },
      },
      paid_amount: {
        type: String,
        default: "0",
      },
      status: {
        type: String,
        enum: ["paid", "unpaid"],
        default: "unpaid",
      },
    },
  ],
});

// Middleware to generate a unique payment_id before validating
portfolioSchema.pre("validate", async function (next) {
  if (this.isNew) {
    let isUnique = false;
    while (!isUnique) {
      const potentialId = generatePaymentId();
      const existingPortfolio = await Portfolio.findOne({ payment_id: potentialId });
      if (!existingPortfolio) {
        this.payment_id = potentialId;
        isUnique = true;
      }
    }
  }
  next();
});

// Initialize the payment structure for 12 months with next_payment on the 5th of each month
portfolioSchema.pre("save", function (next) {
  if (this.isNew) {
    this.payment_structure = [];
    let initialDate = new Date(this.created_at);
    initialDate.setDate(5);
    for (let i = 1; i <= 12; i++) {
      let previousPaymentDate = new Date(initialDate);
      previousPaymentDate.setMonth(previousPaymentDate.getMonth() + (i - 1));
      let nextPaymentDate = new Date(previousPaymentDate);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

      this.payment_structure.push({
        previous_payment: previousPaymentDate,
        next_payment: nextPaymentDate,
      });
    }
  }
  next();
});

const Portfolio = mongoose.model("Portfolio", portfolioSchema);
module.exports = Portfolio;
