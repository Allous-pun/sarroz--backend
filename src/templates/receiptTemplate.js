const generateReceiptHTML = (data, settings) => {
  const {
    receiptNumber,
    date,
    customer,
    items,
    subtotal,
    discount,
    tax,
    total,
    paymentMethod,
    paymentReference,
    cashTendered,
    changeDue,
    notes
  } = data;

  const { business, receipt: receiptSettings, general } = settings;

  // Format currency
  const formatMoney = (amount) => {
    return `${general.currency} ${amount.toLocaleString()}`;
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-KE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper to format variant display
  const formatVariant = (variant) => {
    if (!variant) return '';
    if (variant instanceof Map) {
      const variantObj = Object.fromEntries(variant);
      const values = Object.values(variantObj);
      return values.length > 0 ? ` (${values.join('/')})` : '';
    }
    if (typeof variant === 'object') {
      const values = Object.values(variant);
      return values.length > 0 ? ` (${values.join('/')})` : '';
    }
    return '';
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt ${receiptNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          width: ${receiptSettings.paperSize === '58mm' ? '200px' : '300px'};
          margin: 0 auto;
          padding: 10px;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px dashed #000;
        }
        .business-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .business-info {
          font-size: 10px;
          margin-bottom: 3px;
        }
        .receipt-title {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          margin: 10px 0;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 10px;
        }
        .items-header {
          font-weight: bold;
          margin-top: 10px;
          margin-bottom: 5px;
          padding-bottom: 3px;
          border-bottom: 1px solid #000;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: 10px;
        }
        .item-name {
          flex: 2;
          word-break: break-word;
        }
        .item-qty {
          width: 40px;
          text-align: center;
        }
        .item-price {
          width: 60px;
          text-align: right;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-top: 5px;
          padding-top: 5px;
          border-top: 1px dashed #000;
          font-weight: bold;
        }
        .payment-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px dashed #000;
          font-size: 10px;
        }
        .thankyou {
          font-size: 12px;
          font-weight: bold;
          margin: 10px 0;
          text-align: center;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="business-name">${business.name}</div>
        ${receiptSettings.showBusinessAddress ? `<div class="business-info">${business.address}</div>` : ''}
        <div class="business-info">Tel: ${business.phone}</div>
        ${business.email ? `<div class="business-info">${business.email}</div>` : ''}
        ${business.taxPin ? `<div class="business-info">PIN: ${business.taxPin}</div>` : ''}
      </div>

      <div class="receipt-title">${receiptSettings.title || 'SALES RECEIPT'}</div>

      <div class="info-row">
        <span>Receipt #:</span>
        <span>${receiptNumber}</span>
      </div>
      <div class="info-row">
        <span>Date:</span>
        <span>${formatDate(date)}</span>
      </div>
      ${customer?.name ? `
      <div class="info-row">
        <span>Customer:</span>
        <span>${customer.name}</span>
      </div>
      ` : ''}
      ${customer?.phone ? `
      <div class="info-row">
        <span>Phone:</span>
        <span>${customer.phone}</span>
      </div>
      ` : ''}

      <div class="divider"></div>

      <div class="items-header">
        <div class="item-row">
          <span class="item-name">ITEM</span>
          <span class="item-qty">QTY</span>
          <span class="item-price">TOTAL</span>
        </div>
      </div>

      ${items.map(item => `
        <div class="item-row">
          <span class="item-name">${item.name}${formatVariant(item.variant)}</span>
          <span class="item-qty">${item.quantity}</span>
          <span class="item-price">${formatMoney(item.total)}</span>
        </div>
      `).join('')}

      <div class="divider"></div>

      <div class="payment-row">
        <span>Subtotal:</span>
        <span>${formatMoney(subtotal)}</span>
      </div>

      ${discount > 0 ? `
      <div class="payment-row">
        <span>Discount:</span>
        <span>-${formatMoney(discount)}</span>
      </div>
      ` : ''}

      ${tax.amount > 0 && receiptSettings.showTaxBreakdown ? `
      <div class="payment-row">
        <span>${tax.name} (${tax.rate}%):</span>
        <span>${formatMoney(tax.amount)}</span>
      </div>
      ` : ''}

      <div class="total-row">
        <span>TOTAL:</span>
        <span>${formatMoney(total)}</span>
      </div>

      ${cashTendered ? `
      <div class="payment-row">
        <span>Cash Tendered:</span>
        <span>${formatMoney(cashTendered)}</span>
      </div>
      <div class="payment-row">
        <span>Change Due:</span>
        <span>${formatMoney(changeDue)}</span>
      </div>
      ` : ''}

      <div class="divider"></div>

      <div class="payment-row">
        <span>Payment:</span>
        <span>${paymentMethod.toUpperCase()}</span>
      </div>
      ${paymentReference ? `
      <div class="payment-row">
        <span>Ref:</span>
        <span>${paymentReference}</span>
      </div>
      ` : ''}

      ${receiptSettings.showRemainingBalance && data.remainingBalance > 0 ? `
      <div class="payment-row" style="color: red;">
        <span>Remaining Balance:</span>
        <span>${formatMoney(data.remainingBalance)}</span>
      </div>
      ` : ''}

      ${notes ? `
      <div class="divider"></div>
      <div class="info-row">
        <span>Notes:</span>
        <span>${notes}</span>
      </div>
      ` : ''}

      <div class="footer">
        <div>${receiptSettings.header}</div>
        <div class="thankyou">THANK YOU!</div>
        <div>${receiptSettings.footer}</div>
        ${receiptSettings.showSignature ? '<div>Authorized Signature: _________________</div>' : ''}
        ${receiptSettings.showQRCode ? '<div>Scan QR for digital receipt</div>' : ''}
      </div>
    </body>
    </html>
  `;
};

// Gift receipt template (no prices)
const generateGiftReceiptHTML = (data, settings) => {
  const { receiptNumber, date, customer, items, notes } = data;
  const { business, receipt: receiptSettings } = settings;

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-KE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatVariant = (variant) => {
    if (!variant) return '';
    if (variant instanceof Map) {
      const variantObj = Object.fromEntries(variant);
      const values = Object.values(variantObj);
      return values.length > 0 ? ` (${values.join('/')})` : '';
    }
    if (typeof variant === 'object') {
      const values = Object.values(variant);
      return values.length > 0 ? ` (${values.join('/')})` : '';
    }
    return '';
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Gift Receipt ${receiptNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          width: 300px;
          margin: 0 auto;
          padding: 10px;
        }
        .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
        .business-name { font-size: 16px; font-weight: bold; }
        .gift-badge { text-align: center; font-size: 14px; font-weight: bold; margin: 10px 0; color: #666; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .item-row { margin-bottom: 3px; }
        .footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #000; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="business-name">${business.name}</div>
        <div class="gift-badge">🎁 GIFT RECEIPT 🎁</div>
      </div>
      <div class="info-row">Receipt #: ${receiptNumber}</div>
      <div class="info-row">Date: ${formatDate(date)}</div>
      ${customer?.name ? `<div class="info-row">Customer: ${customer.name}</div>` : ''}
      <div class="divider"></div>
      <div class="items-header">ITEMS PURCHASED:</div>
      ${items.map(item => `
        <div class="item-row">${item.quantity}x ${item.name}${formatVariant(item.variant)}</div>
      `).join('')}
      ${notes ? `<div class="divider"></div><div>Notes: ${notes}</div>` : ''}
      <div class="footer">
        <div>Thank you for your purchase!</div>
        <div>This is a gift receipt - prices are hidden</div>
      </div>
    </body>
    </html>
  `;
};

// Tax invoice template (detailed for B2B)
const generateTaxInvoiceHTML = (data, settings) => {
  const { receiptNumber, date, customer, items, subtotal, discount, tax, total, paymentMethod, paymentReference } = data;
  const { business, receipt: receiptSettings, general } = settings;

  const formatMoney = (amount) => `${general.currency} ${amount.toLocaleString()}`;
  const formatDate = (date) => new Date(date).toLocaleString('en-KE');

  const formatVariant = (variant) => {
    if (!variant) return '-';
    if (variant instanceof Map) {
      const variantObj = Object.fromEntries(variant);
      const values = Object.values(variantObj);
      return values.length > 0 ? values.join('/') : '-';
    }
    if (typeof variant === 'object') {
      const values = Object.values(variant);
      return values.length > 0 ? values.join('/') : '-';
    }
    return '-';
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Tax Invoice ${receiptNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #000; }
        .business-info { text-align: left; }
        .invoice-info { text-align: right; }
        .business-name { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
        .tax-badge { background: #000; color: #fff; padding: 3px 8px; display: inline-block; margin-top: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .totals { width: 300px; margin-left: auto; margin-top: 20px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="business-info">
          <div class="business-name">${business.name}</div>
          <div>${business.address}</div>
          <div>Tel: ${business.phone} | Email: ${business.email}</div>
          <div>PIN: ${business.taxPin}</div>
          <div class="tax-badge">TAX INVOICE</div>
        </div>
        <div class="invoice-info">
          <div><strong>Invoice #:</strong> ${receiptNumber}</div>
          <div><strong>Date:</strong> ${formatDate(date)}</div>
          ${customer?.name ? `<div><strong>Customer:</strong> ${customer.name}</div>` : ''}
          ${customer?.phone ? `<div><strong>Phone:</strong> ${customer.phone}</div>` : ''}
          ${customer?.email ? `<div><strong>Email:</strong> ${customer.email}</div>` : ''}
        </div>
      </div>

      <table>
        <thead>
          <tr><th>Item</th><th>Variant</th><th>Qty</th><th>Unit Price</th><th>Tax</th><th>Total</th></tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${formatVariant(item.variant)}</td>
              <td>${item.quantity}</td>
              <td>${formatMoney(item.unitPrice)}</td>
              <td>${tax.rate}% ${tax.name}</td>
              <td>${formatMoney(item.total)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row"><span>Subtotal:</span><span>${formatMoney(subtotal)}</span></div>
        ${discount > 0 ? `<div class="total-row"><span>Discount:</span><span>-${formatMoney(discount)}</span></div>` : ''}
        <div class="total-row"><span>${tax.name} (${tax.rate}%):</span><span>${formatMoney(tax.amount)}</span></div>
        <div class="total-row grand-total"><span>TOTAL:</span><span>${formatMoney(total)}</span></div>
      </div>

      <div class="footer">
        <div>${receiptSettings.header}</div>
        <div>${receiptSettings.footer}</div>
        <div>Payment Method: ${paymentMethod.toUpperCase()}</div>
        ${paymentReference ? `<div>Reference: ${paymentReference}</div>` : ''}
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  generateReceiptHTML,
  generateGiftReceiptHTML,
  generateTaxInvoiceHTML
};
