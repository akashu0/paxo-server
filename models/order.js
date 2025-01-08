const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const generatePaymentId = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit random number
  return `PAXOORID${randomNum}`;
};

const orderSchema = new Schema({
  product_id: {
    type: Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  total_area: {
    type: Number,
    required: true,
  },
  total_price: {
    type: Number,
    required: true,
  },
  one_square_feet_price: {
    type: Number,
    required: true,
  },
  capital_appreciation: {
    type: Number,
    required: true,
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  payment_method: {
    type: String,
    default: null,
  },
  paxowealthOrderId: {
    type: String,
    unique: true,
    required: true,
  },
  payment_status: {
    type: String,
    enum: ["Pending", "Completed", "Failed", "Payment Initiated"],
    default: "Payment Initiated",
  },
  is_sold: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  transactionId: {
    type: String,
  },
  transactionIdFile: {
    type: String,
  },
  payment_date: {
    type: String,
  },
});

// Middleware to generate a unique order ID before validation
orderSchema.pre("validate", async function (next) {
  if (this.isNew) {
    let isUnique = false;
    while (!isUnique) {
      const potentialId = generatePaymentId();
      const existingOrder = await Order.findOne({ paxowealthOrderId: potentialId });
      if (!existingOrder) {
        this.paxowealthOrderId = potentialId;
        isUnique = true;
      }
    }
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
