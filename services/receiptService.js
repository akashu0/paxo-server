const PDFDocument = require('pdfkit');

class ReceiptService {
  constructor() {
    this.fontRegular = 'Helvetica';
    this.fontBold = 'Helvetica-Bold';
    
    this.colors = {
      primary: '#2c3e50',
      secondary: '#7f8c8d',
      success: '#27ae60',
      border: '#3498db',
      tableHeader: '#f5f6fa',
      tableBorder: '#dcdde1'
    };

    this.spacing = {
      sectionGap: 25,
      lineGap: 12,
      headerGap: 15
    };
  }

  formatCurrency(amount) {
    return Number(amount).toLocaleString('en-IN');
  }

  generateReceiptId(orderId) {
    return `PW-${orderId.toString().slice(-6).toUpperCase()}`;
  }

  getLogoBuffer(logoData) {
    if (logoData.includes('base64,')) {
      const base64Data = logoData.split('base64,')[1];
      return Buffer.from(base64Data, 'base64');
    }
    return Buffer.from(logoData, 'base64');
  }

  createTable(doc, headers, rows, startY) {
    const columnWidth = 125;
    const cellPadding = 8;
    const rowHeight = 20;
    let currentY = startY;

    // Draw table header
    doc
      .fillColor(this.colors.tableHeader)
      .rect(50, currentY, 500, rowHeight)
      .fill();

    doc.fillColor(this.colors.primary);
    headers.forEach((header, i) => {
      doc
        .font(this.fontBold)
        .fontSize(10)
        .text(
          header,
          50 + (i * columnWidth),
          currentY + cellPadding,
          { width: columnWidth, align: 'center' }
        );
    });

    currentY += rowHeight;

    // Draw table rows
    rows.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 0) {
        doc
          .fillColor('#f8f9fa')
          .rect(50, currentY, 500, rowHeight)
          .fill();
      }

      doc.fillColor(this.colors.secondary);
      row.forEach((cell, i) => {
        doc
          .font(this.fontRegular)
          .fontSize(10)
          .text(
            cell,
            50 + (i * columnWidth),
            currentY + cellPadding,
            { width: columnWidth, align: 'center' }
          );
      });

      currentY += rowHeight;
    });

    // Draw table borders
    doc
      .strokeColor(this.colors.tableBorder)
      .lineWidth(1)
      .rect(50, startY, 500, currentY - startY)
      .stroke();

    return currentY + this.spacing.sectionGap;
  }

  async generateReceipt(orderData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4'
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Add logo if provided
        if (orderData.logoData) {
          const logoBuffer = this.getLogoBuffer(orderData.logoData);
          doc.image(logoBuffer, 250, 40, { 
            width: 100,
            align: 'center'
          });
          doc.moveDown(2);
        }

        // Header section
        let yPos = orderData.logoData ? 160 : 40;
        
        doc
          .font(this.fontBold)
          .fontSize(16)
          .fillColor(this.colors.primary)
          .text('PAYMENT RECEIPT', { align: 'center' })
          .moveDown(0.5);

        // Receipt details
        doc.fontSize(10);
        const leftColumn = 50;
        const rightColumn = 350;

        doc
          .font(this.fontBold)
          .text('Receipt No:', leftColumn, yPos)
          .font(this.fontRegular)
          .text(this.generateReceiptId(orderData.orderId), leftColumn + 70, yPos)
          
          .font(this.fontBold)
          .text('Date:', rightColumn, yPos)
          .font(this.fontRegular)
          .text(new Date().toLocaleDateString('en-IN'), rightColumn + 40, yPos);

        yPos += 30;

        // Customer Details
        doc
          .font(this.fontBold)
          .text('Bill To:', leftColumn, yPos)
          .font(this.fontRegular)
          .text(orderData.customerName, leftColumn, yPos + 20)
          .text(orderData.customerEmail, leftColumn, yPos + 35)
          .text(orderData.customerPhone, leftColumn, yPos + 50);

        yPos += 80;

        // Order Details Table
        const headers = ['Description', '', 'Rate', 'Amount'];
        const rows = [
          [
            orderData.propertyName,
            '1',
            `₹${this.formatCurrency(orderData.baseAmount)}`,
            `₹${this.formatCurrency(orderData.baseAmount)}`
          ],
          [
            'Taxes & Fees',
            '',
            `₹${this.formatCurrency(orderData.taxAmount)}`,
            `₹${this.formatCurrency(orderData.taxAmount)}`
          ]
        ];

        yPos = this.createTable(doc, headers, rows, yPos);

        // Total Amount
        doc
          .font(this.fontBold)
          .fontSize(11)
          .fillColor(this.colors.success)
          .text(
            `Total Amount Paid: ₹${this.formatCurrency(orderData.baseAmount)}`,
            350,
            yPos,
            { align: 'right' }
          );

        yPos += 40;

        // Payment Details
        doc
          .font(this.fontBold)
          .fontSize(11)
          .fillColor(this.colors.primary)
          .text('Payment Details', 50, yPos)
          .moveDown(0.5)
          .font(this.fontRegular)
          .fontSize(10)
          .fillColor(this.colors.secondary)
          .text(`Payment Method: ${orderData.paymentMethod}`)
          .text(`Transaction ID: ${orderData.transactionId}`)
          .text(`Property Type: ${orderData.propertyType}`)
          .text(`Location: ${orderData.location}`)
          .text('Capital Appreciation: 48%')
          .text(`Monthly Earnings: ₹${this.formatCurrency(orderData.monthlyEarnings)}`);

        // Next Steps
        yPos += 120;
        doc
          .font(this.fontBold)
          .fontSize(11)
          .fillColor(this.colors.primary)
          .text('Next Steps', 50, yPos)
          .moveDown(0.5)
          .font(this.fontRegular)
          .fontSize(10)
          .fillColor(this.colors.secondary)
          .text('• Track your property details and payouts on your personalized dashboard.')
          .text('• For any queries, contact us at support@paxowealth.com or call +91-9876543210.');

        // Footer
        doc
          .fontSize(9)
          .fillColor(this.colors.secondary)
          .text('Paxo Wealth - "Smart, Secure, Simplified"', 50, 700, { align: 'center' })
          .moveDown(0.5)
          .text('This is a system-generated receipt. No signature is required.', { align: 'center' })
          .moveDown(0.5)
          .text('www.paxowealth.com', { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new ReceiptService();