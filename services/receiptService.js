const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

class ReceiptService {
  constructor() {
    // Load fonts
    this.fontRegular = 'Helvetica';
    this.fontBold = 'Helvetica-Bold';
    
    // Define colors
    this.colors = {
      primary: '#2c3e50',
      secondary: '#7f8c8d',
      success: '#27ae60',
      border: '#3498db'
    };
  }

  // Helper to format currency
  formatCurrency(amount) {
    return Number(amount).toLocaleString('en-IN');
  }

  // Helper to generate receipt ID
  generateReceiptId(orderId) {
    return `PW-${orderId.toString().slice(-6).toUpperCase()}`;
  }

  // Add text with label
  addDetailRow(doc, label, value, { x = 50, y, labelWidth = 150 }) {
    doc
      .font(this.fontBold)
      .fillColor(this.colors.primary)
      .text(label, x, y)
      .font(this.fontRegular)
      .fillColor(this.colors.secondary)
      .text(value, x + labelWidth, y, { align: 'left' });
  }

  // Add section title
  addSectionTitle(doc, title, y) {
    doc
      .font(this.fontBold)
      .fontSize(14)
      .fillColor(this.colors.primary)
      .text(title, 50, y)
      .moveDown(0.5);

    // Add underline
    doc
      .moveTo(50, y + 20)
      .lineTo(550, y + 20)
      .strokeColor(this.colors.border)
      .stroke();

    return y + 40;
  }

  async generateReceipt(orderData) {
    return new Promise((resolve, reject) => {
      try {
        // Create PDF document
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4'
        });

        // Collect chunks of data
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Header
        doc
          .font(this.fontBold)
          .fontSize(24)
          .fillColor(this.colors.primary)
          .text('Paxo Wealth', { align: 'center' })
          .font(this.fontRegular)
          .fontSize(12)
          .fillColor(this.colors.secondary)
          .text('Empowering Financial Growth with Security', { align: 'center' })
          .moveDown(2);

        // Receipt ID and Date
        doc
          .font(this.fontBold)
          .fontSize(12)
          .fillColor(this.colors.primary);

        this.addDetailRow(doc, 'Receipt ID:', this.generateReceiptId(orderData.orderId), { y: 150 });
        this.addDetailRow(doc, 'Date:', new Date().toLocaleDateString('en-IN'), { y: 170 });

        // Customer Details Section
        let yPos = this.addSectionTitle(doc, 'Customer Details', 210);
        this.addDetailRow(doc, 'Name:', orderData.customerName, { y: yPos });
        this.addDetailRow(doc, 'Email:', orderData.customerEmail, { y: yPos + 20 });
        this.addDetailRow(doc, 'Phone:', orderData.customerPhone, { y: yPos + 40 });

        // Order Summary Section
        yPos = this.addSectionTitle(doc, 'Order Summary', yPos + 80);
        this.addDetailRow(doc, 'Property Name:', orderData.propertyName, { y: yPos });
        this.addDetailRow(doc, 'Type:', orderData.propertyType, { y: yPos + 20 });
        this.addDetailRow(doc, 'Location:', orderData.location, { y: yPos + 40 });
        this.addDetailRow(doc, 'Growth Rate:', orderData.capitalAppreciation + '% p.a.', { y: yPos + 60 });
        this.addDetailRow(doc, 'Tenure:', '12 Months', { y: yPos + 80 });
        this.addDetailRow(doc, 'Monthly Payouts:', '₹' + this.formatCurrency(orderData.monthlyEarnings), { y: yPos + 100 });

        // Payment Details Section
        yPos = this.addSectionTitle(doc, 'Payment Details', yPos + 140);
        
        // Amount Paid (highlighted)
        doc
          .font(this.fontBold)
          .fontSize(14)
          .fillColor(this.colors.success)
          .text('Amount Paid: ₹' + this.formatCurrency(orderData.totalAmount), 50, yPos)
          .moveDown(1);

        yPos += 40;
        this.addDetailRow(doc, 'Property Price:', '₹' + this.formatCurrency(orderData.baseAmount), { y: yPos });
        this.addDetailRow(doc, 'Taxes and Fees:', '₹' + this.formatCurrency(orderData.taxAmount), { y: yPos + 20 });
        this.addDetailRow(doc, 'Payment Method:', orderData.paymentMethod, { y: yPos + 40 });
        this.addDetailRow(doc, 'Transaction ID:', orderData.transactionId, { y: yPos + 60 });
        this.addDetailRow(doc, 'Payment Date:', orderData.paymentDate, { y: yPos + 80 });

        // Next Steps Section
        yPos = this.addSectionTitle(doc, 'Next Steps', yPos + 120);
        doc
          .font(this.fontRegular)
          .fontSize(10)
          .fillColor(this.colors.secondary)
          .list([
            'Track your property details and payouts on your personalized dashboard.',
            'For any queries, contact us at support@paxowealth.com or call +91-9876543210.'
          ], 50, yPos);

        // Footer
        doc
          .fontSize(10)
          .fillColor(this.colors.secondary)
          .text('Paxo Wealth - "Smart, Secure, Simplified"', 50, 750, { align: 'center' })
          .text('This is a system-generated receipt. No signature is required.', 50, 770, { align: 'center' })
          .text('www.paxowealth.com', 50, 790, { align: 'center' });

        // Finalize the PDF
        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new ReceiptService();