import PDFDocument from 'pdfkit';
import fs from 'fs-extra';
import path from 'path';
import { Order } from '@shared/schema';

/**
 * Generates a branded PDF for an order
 * @param order The order data
 * @returns The path to the generated PDF
 */
export async function generateOrderPDF(order: Order): Promise<string> {
  // Create the orders/pdfs directory if it doesn't exist
  const pdfDir = path.join(process.cwd(), 'orders', 'pdfs');
  await fs.ensureDir(pdfDir);
  
  // Create a unique filename based on the order UUID
  const pdfFilePath = path.join(pdfDir, `order_${order.uuid}.pdf`);
  
  // Create a write stream for the PDF file
  const stream = fs.createWriteStream(pdfFilePath);
  
  // Create a new PDF document
  const doc = new PDFDocument({
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    size: 'A4',
  });
  
  // Pipe the PDF to the file
  doc.pipe(stream);
  
  // Add ProJersey logo header
  doc.fontSize(24).text('ProJersey', { align: 'center' });
  doc.fontSize(12).text('Custom Jersey Design & Manufacturing', { align: 'center' });
  doc.moveDown(2);
  
  // Order details header
  doc.fontSize(18).text('Order Confirmation', { align: 'center' });
  doc.moveDown();
  
  // Order details
  doc.fontSize(12).text(`Order #: ${order.uuid}`);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
  doc.text(`Status: ${order.status}`);
  doc.moveDown();
  
  // Customer information
  doc.fontSize(16).text('Customer Information', { underline: true });
  doc.fontSize(12).text(`User ID: ${order.userId}`);
  if (order.shippingAddress) {
    doc.text('Shipping Address:');
    const address = order.shippingAddress;
    doc.text(`${address.name}`);
    doc.text(`${address.street}`);
    doc.text(`${address.city}, ${address.state} ${address.zip}`);
    doc.text(`${address.country}`);
    doc.text(`Phone: ${address.phone}`);
  }
  doc.moveDown();
  
  // Sport and design information
  doc.fontSize(16).text('Design Information', { underline: true });
  doc.fontSize(12).text(`Sport: ${order.sport}`);
  doc.text(`Kit Type: ${order.kitType}`);
  if (order.customTeamName) {
    doc.text(`Team Name: ${order.customTeamName}`);
  }
  doc.moveDown();
  
  // Order items
  if (order.orderDetails && order.orderDetails.items && order.orderDetails.items.length > 0) {
    doc.fontSize(16).text('Order Items', { underline: true });
    
    // Create a table header
    doc.fontSize(12).text('Type', 50, doc.y, { width: 100 });
    doc.text('Size', 150, doc.y - 12, { width: 80 });
    doc.text('Gender', 230, doc.y - 12, { width: 80 });
    doc.text('Quantity', 310, doc.y - 12, { width: 80 });
    doc.text('Price', 390, doc.y - 12, { width: 100 });
    doc.moveDown();
    
    // Add a line
    doc.moveTo(50, doc.y - 5).lineTo(500, doc.y - 5).stroke();
    doc.moveDown(0.5);
    
    // List items
    for (const item of order.orderDetails.items) {
      doc.fontSize(10).text(item.type, 50, doc.y, { width: 100 });
      doc.text(item.size, 150, doc.y - 10, { width: 80 });
      doc.text(item.gender, 230, doc.y - 10, { width: 80 });
      doc.text(item.quantity.toString(), 310, doc.y - 10, { width: 80 });
      doc.text(`$${item.price.toFixed(2)}`, 390, doc.y - 10, { width: 100 });
      doc.moveDown();
    }
    
    // Add a line
    doc.moveTo(50, doc.y - 5).lineTo(500, doc.y - 5).stroke();
    doc.moveDown();
  }
  
  // Add-ons
  if (order.orderDetails && order.orderDetails.addOns && order.orderDetails.addOns.length > 0) {
    doc.fontSize(16).text('Add-ons', { underline: true });
    
    // Create a table header
    doc.fontSize(12).text('Item', 50, doc.y, { width: 200 });
    doc.text('Quantity', 250, doc.y - 12, { width: 100 });
    doc.text('Price', 350, doc.y - 12, { width: 100 });
    doc.moveDown();
    
    // Add a line
    doc.moveTo(50, doc.y - 5).lineTo(500, doc.y - 5).stroke();
    doc.moveDown(0.5);
    
    // List add-ons
    for (const addon of order.orderDetails.addOns) {
      doc.fontSize(10).text(addon.name, 50, doc.y, { width: 200 });
      doc.text(addon.quantity.toString(), 250, doc.y - 10, { width: 100 });
      doc.text(`$${addon.price.toFixed(2)}`, 350, doc.y - 10, { width: 100 });
      doc.moveDown();
    }
    
    // Add a line
    doc.moveTo(50, doc.y - 5).lineTo(500, doc.y - 5).stroke();
    doc.moveDown();
  }
  
  // Price summary
  doc.fontSize(16).text('Price Summary', { underline: true });
  doc.fontSize(12).text(`Subtotal: $${(order.totalAmount / 100).toFixed(2)}`);
  
  if (order.orderDetails?.discount) {
    doc.fontSize(12).text(`Discount: -$${order.orderDetails.discount.toFixed(2)}`);
  }
  
  doc.fontSize(14).text(`Total: $${(order.totalAmount / 100).toFixed(2)}`);
  doc.moveDown(2);
  
  // Add design images if they exist
  if (order.designUrls) {
    doc.fontSize(16).text('Your Design', { underline: true });
    doc.moveDown();
    
    // Note: In a production app, we would fetch and embed the actual images here
    // For this example, we'll just include the URLs as text
    doc.fontSize(12).text('Front Design URL:');
    doc.fontSize(10).text(order.designUrls.front || 'N/A');
    doc.moveDown();
    
    doc.fontSize(12).text('Back Design URL:');
    doc.fontSize(10).text(order.designUrls.back || 'N/A');
    doc.moveDown();
  }
  
  // Add notes or promotions at the bottom
  doc.moveDown(2);
  doc.fontSize(10).text('Thank you for choosing ProJersey for your custom jersey needs!', { align: 'center' });
  doc.fontSize(10).text('For any questions, please contact support@projersey.com', { align: 'center' });
  
  // Finalize the PDF and end the stream
  doc.end();
  
  // Return a Promise that resolves when the PDF is written
  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      resolve(pdfFilePath);
    });
    
    stream.on('error', (err) => {
      reject(err);
    });
  });
}

export default {
  generateOrderPDF
};