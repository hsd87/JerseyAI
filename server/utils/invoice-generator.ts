import { Order } from "@shared/schema";
import { ShippingAddress } from "../../shared/types/order";
import fs from 'fs';
import path from 'path';
import { storage } from "../storage";

/**
 * Generate an invoice for a completed order
 * @param order The completed order
 * @returns The invoice details including file path
 */
export async function generateInvoice(order: Order): Promise<{ 
  invoiceNumber: string,
  invoiceUrl: string,
  invoiceDate: string 
}> {
  try {
    // Create a unique invoice number based on order ID and timestamp
    const invoiceDate = new Date();
    const invoiceNumber = `INV-${order.id}-${Math.floor(invoiceDate.getTime() / 1000)}`;
    
    // Generate the invoice content (HTML format)
    const invoiceHtml = createInvoiceHtml(order, {
      invoiceNumber,
      invoiceDate: invoiceDate.toISOString()
    });
    
    // Create invoices directory if it doesn't exist
    const invoiceDir = path.join(process.cwd(), 'invoices');
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }
    
    // Save invoice to file
    const invoiceFilename = `${invoiceNumber}.html`;
    const invoicePath = path.join(invoiceDir, invoiceFilename);
    fs.writeFileSync(invoicePath, invoiceHtml);
    
    // Store invoice URL in the order record
    const invoiceUrl = `/invoices/${invoiceFilename}`;
    await storage.updateOrderInvoice(order.id, {
      invoiceNumber,
      invoiceUrl,
      invoiceDate: invoiceDate.toISOString()
    });
    
    return {
      invoiceNumber,
      invoiceUrl,
      invoiceDate: invoiceDate.toISOString()
    };
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw new Error('Failed to generate invoice. Please contact support.');
  }
}

/**
 * Create HTML content for the invoice
 */
function createInvoiceHtml(order: Order, invoice: { 
  invoiceNumber: string, 
  invoiceDate: string 
}): string {
  // Parse order details
  const orderDetails = typeof order.orderDetails === 'string' 
    ? JSON.parse(order.orderDetails) 
    : order.orderDetails;
  
  const shippingAddress = typeof order.shippingAddress === 'string'
    ? JSON.parse(order.shippingAddress)
    : order.shippingAddress;
  
  const formattedDate = new Date(invoice.invoiceDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Calculate totals
  const subtotal = order.totalAmount / 100; // Convert cents to dollars
  const tax = subtotal * 0.08; // Assuming 8% tax
  const total = subtotal + tax;
  
  // Build the HTML content
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    .invoice-box {
      max-width: 800px;
      margin: auto;
      padding: 30px;
      border: 1px solid #eee;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
      font-size: 16px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .company-info {
      text-align: right;
    }
    .invoice-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #FF4081;
    }
    .customer-details, .invoice-details {
      margin-bottom: 20px;
    }
    .invoice-details {
      text-align: right;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    table th, table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    table th {
      background-color: #f8f8f8;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
    }
    .totals table {
      width: 300px;
      margin-top: 20px;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      color: #888;
      font-size: 14px;
    }
    .logo {
      max-width: 150px;
      height: auto;
    }
  </style>
</head>
<body>
  <div class="invoice-box">
    <div class="header">
      <div>
        <img src="/assets/okdio-logo.png" alt="OKDIO" class="logo">
      </div>
      <div class="company-info">
        <div class="invoice-title">INVOICE</div>
        <p>
          OKDIO<br>
          123 Sports Way<br>
          New York, NY 10001<br>
          support@okdio.com
        </p>
      </div>
    </div>
    
    <div style="display: flex; justify-content: space-between;">
      <div class="customer-details">
        <strong>Bill To:</strong><br>
        ${shippingAddress?.firstName || ''} ${shippingAddress?.lastName || ''}<br>
        ${shippingAddress?.street || ''}<br>
        ${shippingAddress?.city || ''}, ${shippingAddress?.state || ''} ${shippingAddress?.zipCode || ''}<br>
        ${shippingAddress?.country || ''}<br>
        ${shippingAddress?.email || ''}
      </div>
      
      <div class="invoice-details">
        <strong>Invoice Number:</strong> ${invoice.invoiceNumber}<br>
        <strong>Invoice Date:</strong> ${formattedDate}<br>
        <strong>Order ID:</strong> #${order.id}<br>
        <strong>Payment Method:</strong> Credit Card
      </div>
    </div>
    
    <table>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Price</th>
        <th>Amount</th>
      </tr>
      ${orderDetails?.items?.map((item: any) => `
        <tr>
          <td>${item.type || 'Jersey'} (${item.size}, ${item.gender})</td>
          <td>${item.quantity}</td>
          <td>$${(item.price).toFixed(2)}</td>
          <td>$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `).join('') || ''}
      
      ${orderDetails?.addOns?.map((addon: any) => `
        <tr>
          <td>${addon.name} (Add-on)</td>
          <td>${addon.quantity}</td>
          <td>$${(addon.price).toFixed(2)}</td>
          <td>$${(addon.price * addon.quantity).toFixed(2)}</td>
        </tr>
      `).join('') || ''}
    </table>
    
    <div class="totals">
      <table>
        <tr>
          <td>Subtotal:</td>
          <td>$${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Tax (8%):</td>
          <td>$${tax.toFixed(2)}</td>
        </tr>
        <tr>
          <td><strong>Total:</strong></td>
          <td><strong>$${total.toFixed(2)}</strong></td>
        </tr>
      </table>
    </div>
    
    <div class="footer">
      <p>Thank you for your business with OKDIO!</p>
      <p>For any questions regarding this invoice, please contact our customer support at support@okdio.com</p>
    </div>
  </div>
</body>
</html>
  `;
}