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
      minimum_sqft: String  // Added minimum_sqft field
    },

    // capitalAppreciation: {
    //   value: Number,
    //   prelistedBuyerId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
    // },


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
      },
      paymentDate: {
        type: String,
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

      // Calculate total area using minimum_sqft
      const totalArea = Number(this.units) * Number(property.minimum_sqft);
      const totalPrice = Number(this.units) * Number(property.property_unit_price) * Number(property.minimum_sqft);
      const taxes = Math.ceil(totalPrice * 0.05); // 5% taxes
      const monthlyEarnings = property.capital_appreciation ? 
        Math.ceil(((property.capital_appreciation / 100) * totalPrice) / 12) : 0;

      // Calculate available units based on total area and minimum_sqft
      const updatedAvailableUnits = Math.floor(totalArea / Number(property.minimum_sqft));

      // Set total amount including tax
      this.totalAmount = String(totalPrice);
      
      // Store all calculated details including minimum_sqft
      this.priceDetails = {
        totalArea: String(totalArea),
        baseAmount: String(totalPrice),
        taxAmount: String(taxes),
        monthlyEarnings: String(monthlyEarnings),
        pricePerUnit: String(property.property_unit_price),
        capitalAppreciation: property.capital_appreciation ? 
          String(property.capital_appreciation) + '%' : '0%',
        minimum_sqft: property.minimum_sqft
      };
      
      if (Number(this.units) > updatedAvailableUnits) {
        throw new Error('Not enough units available');
      }

      // Update property's available units
      property.available_unit = String(Number(property.available_unit) - Number(this.units));
      await property.save();

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
        // Calculate available units based on total area and minimum_sqft
        const totalArea = Number(this.units) * Number(property.minimum_sqft);
        const updatedAvailableUnits = Math.floor(totalArea / Number(property.minimum_sqft));
        
        property.available_unit = String(Number(property.available_unit) - updatedAvailableUnits);
        await property.save();
      }
    } catch (error) {
      console.error('Error updating property available units:', error);
    }
  }
});

// Post-update middleware to handle status changes
orderSchema.post("findOneAndUpdate", async function() {
  const docToUpdate = await this.model.findOne(this.getQuery());
  if (docToUpdate && docToUpdate.orderStatus === 'confirmed') {
    try {
      const property = await mongoose.model('Property').findById(docToUpdate.property);
      if (property) {
        // Calculate available units based on total area and minimum_sqftx1q
        const totalArea = Number(docToUpdate.units) * Number(property.minimum_sqft);
        const updatedAvailableUnits = Math.floor(totalArea / Number(property.minimum_sqft));
        
        property.available_unit = String(Number(property.available_unit) - updatedAvailableUnits);
        await property.save();
      }
    } catch (error) {
      console.error('Error updating property available units after status change:', error);
    }
  }
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;