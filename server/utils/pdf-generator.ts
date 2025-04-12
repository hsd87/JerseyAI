import fs from 'fs-extra';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Order, User } from '@shared/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';

// Ensure the orders directory exists
const ensureOrderDirectories = async () => {
  const ordersDir = path.resolve(process.cwd(), 'orders');
  const pdfsDir = path.resolve(ordersDir, 'pdfs');
  
  await fs.ensureDir(ordersDir);
  await fs.ensureDir(pdfsDir);
  
  return { ordersDir, pdfsDir };
};

/**
 * Generates a branded PDF for an order
 * @param order The order data
 * @returns The path to the generated PDF
 */
export async function generateOrderPDF(order: Order): Promise<string> {
  // Get user information
  const userResult = await db.select().from(users).where(eq(users.id, order.userId));
  const user = userResult[0];
  
  if (!user) {
    throw new Error(`User not found for order ${order.id}`);
  }
  
  // Create directories
  const { pdfsDir } = await ensureOrderDirectories();
  
  // Create PDF file path
  const pdfFileName = `order_${order.uuid}.pdf`;
  const pdfFilePath = path.join(pdfsDir, pdfFileName);
  
  // Create a new PDF document
  const doc = new PDFDocument({ margin: 50 });
  
  // Pipe the PDF output to a file
  const stream = fs.createWriteStream(pdfFilePath);
  doc.pipe(stream);
  
  // Add header with logo
  doc.fontSize(25).text('ProJersey', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text('Custom Jersey Order Summary', { align: 'center' });
  doc.moveDown(2);
  
  // Add order information
  doc.fontSize(12).text(`Order ID: ${order.uuid}`);
  doc.fontSize(12).text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
  doc.moveDown();
  
  // Customer information
  doc.fontSize(16).text('Customer Information', { underline: true });
  doc.fontSize(12).text(`Name: ${user.username}`);
  doc.fontSize(12).text(`Email: ${user.email || 'Not provided'}`);
  doc.moveDown();
  
  // Shipping address
  doc.fontSize(16).text('Shipping Address', { underline: true });
  if (order.shippingAddress) {
    doc.fontSize(12).text(`${order.shippingAddress.name}`);
    doc.fontSize(12).text(`${order.shippingAddress.street}`);
    doc.fontSize(12).text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`);
    doc.fontSize(12).text(`${order.shippingAddress.country}`);
    doc.fontSize(12).text(`Phone: ${order.shippingAddress.phone}`);
  } else {
    doc.fontSize(12).text('No shipping address provided');
  }
  doc.moveDown();
  
  // Order details
  doc.fontSize(16).text('Order Details', { underline: true });
  doc.fontSize(12).text(`Sport: ${order.sport}`);
  
  if (order.orderDetails) {
    doc.fontSize(12).text(`Package: ${order.orderDetails.packageType}`);
    
    if (order.orderDetails.isTeamOrder && order.orderDetails.teamName) {
      doc.fontSize(12).text(`Team Name: ${order.orderDetails.teamName}`);
    }
    
    doc.moveDown();
    
    // Items
    doc.fontSize(14).text('Items:', { underline: true });
    if (order.orderDetails.items && order.orderDetails.items.length > 0) {
      order.orderDetails.items.forEach((item, index) => {
        doc.fontSize(12).text(`${index + 1}. ${item.gender} ${item.type} - Size: ${item.size}, Quantity: ${item.quantity}, Price: $${item.price.toFixed(2)}`);
      });
    }
    
    doc.moveDown();
    
    // Add-ons
    if (order.orderDetails.addOns && order.orderDetails.addOns.length > 0) {
      doc.fontSize(14).text('Add-ons:', { underline: true });
      order.orderDetails.addOns.forEach((addon, index) => {
        doc.fontSize(12).text(`${index + 1}. ${addon.name} - Quantity: ${addon.quantity}, Price: $${addon.price.toFixed(2)}`);
      });
      doc.moveDown();
    }
    
    // Delivery timeline
    if (order.orderDetails.deliveryTimeline) {
      doc.fontSize(12).text(`Estimated Delivery: ${order.orderDetails.deliveryTimeline}`);
      doc.moveDown();
    }
  }
  
  // Price summary
  doc.fontSize(16).text('Price Summary', { underline: true });
  doc.fontSize(12).text(`Subtotal: $${(order.totalAmount / 100).toFixed(2)}`);
  
  if (order.orderDetails?.discount) {
    doc.fontSize(12).text(`Discount: -$${order.orderDetails.discount.toFixed(2)}`);
  }
  
  doc.fontSize(14).text(`Total: $${(order.totalAmount / 100).toFixed(2)}`, { bold: true });
  doc.moveDown(2);
  
  // Add design images if they exist
  if (order.designUrls) {
    doc.fontSize(16).text('Your Design', { underline: true });
    doc.moveDown();
    
    // Note: In a production app, we would fetch and embed the actual images here
    // For this example, we'll just include the URLs as text
    doc.fontSize(12).text('Front Design URL:', { bold: true });
    doc.fontSize(10).text(order.designUrls.front || 'N/A');
    doc.moveDown();
    
    doc.fontSize(12).text('Back Design URL:', { bold: true });
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