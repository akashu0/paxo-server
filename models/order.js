const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    units: {
      type: String,
      required: true
    },
    totalAmount: {
      type: String
    },
    priceDetails: {
      totalArea: String,
      baseAmount: String,
      taxAmount: String,
      monthlyEarnings: String,
      pricePerUnit: String,
      capitalAppreciation: String
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'completed', 'refunded'],
      default: 'pending'
    },
    paymentDetails: {
      method: {
        type: String,
        required: true
      },
      paidAmount: {
        type: String,
        required: true
      },
      transactionId: {
        type: String,
        required: true
      },
      paymentDate: {
        type: String,
        required: true
      },
      paymentProof: {
        type: String
      },
      verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      verificationDate: {
        type: String
      },
      verificationNotes: {
        type: String
      }
    },
    isActive: {
      type: String,
      enum: ["active", "inactive", "deleted"],
      default: "active"
    }
  },
  { timestamps: true }
);

// Pre-save middleware to calculate total amount and other values
orderSchema.pre("save", async function(next) {
  if (this.isModified('units') || !this.totalAmount) {
    try {
      const property = await mongoose.model('Property').findById(this.property);
      if (!property) {
        throw new Error('Property not found');
      }

      // Calculate all values using the provided formula
      const totalArea = Number(this.units) * 100;
      const totalPrice = Number(this.units) * Number(property.property_unit_price) * 100;
      const taxes = Math.ceil(totalPrice * 0.05); // 5% taxes
      const monthlyEarnings = property.capital_appreciation ? 
        Math.ceil(((property.capital_appreciation / 100) * totalPrice) / 12) : 0;

      // Set total amount including tax
      this.totalAmount = String(totalPrice + taxes);
      
      // Store all calculated details
      this.priceDetails = {
        totalArea: String(totalArea),
        baseAmount: String(totalPrice),
        taxAmount: String(taxes),
        monthlyEarnings: String(monthlyEarnings),
        pricePerUnit: String(property.property_unit_price),
        capitalAppreciation: property.capital_appreciation ? 
          String(property.capital_appreciation) + '%' : '0%'
      };
      
      if (Number(this.units) > Number(property.available_unit)) {
        throw new Error('Not enough units available');
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Post-save middleware to update property available units
orderSchema.post("save", async function() {
  if (this.orderStatus === 'confirmed') {
    try {
      const property = await mongoose.model('Property').findById(this.property);
      if (property) {
        property.available_unit = String(Number(property.available_unit) - Number(this.units));
        await property.save();
      }
    } catch (error) {
      console.error('Error updating property available units:', error);
    }
  }
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;