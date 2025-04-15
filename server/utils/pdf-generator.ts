import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { Order } from "@shared/schema";

/**
 * Generate a PDF invoice/order confirmation for an order
 * @param order Order object
 * @returns Path to the generated PDF file
 */
export async function generateOrderPDF(order: Order): Promise<string> {
  // Create output directory if it doesn't exist
  const outputDir = path.join(process.cwd(), "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create PDF filename
  const fileName = `order_${order.id}_${Date.now()}.pdf`;
  const filePath = path.join(outputDir, fileName);
  
  // Create PDF
  const doc = new PDFDocument({ margin: 50 });
  
  // Pipe PDF to file
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  
  // Add content to PDF
  // Header
  doc
    .fontSize(25)
    .text("ProJersey", { align: "center" })
    .fontSize(15)
    .text("Order Confirmation", { align: "center" })
    .moveDown();
  
  // Order details
  doc
    .fontSize(12)
    .text(`Order Number: #${order.id}`, { align: "left" })
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: "left" })
    .text(`Status: ${order.status}`, { align: "left" })
    .moveDown();
  
  // Customer info
  if (order.shippingAddress) {
    doc
      .fontSize(14)
      .text("Shipping Information", { underline: true })
      .fontSize(12)
      .text(`Name: ${order.shippingAddress.name}`)
      .text(`Address: ${order.shippingAddress.street}`)
      .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`)
      .text(`Country: ${order.shippingAddress.country}`)
      .text(`Phone: ${order.shippingAddress.phone}`)
      .moveDown();
  }
  
  // Order items
  doc
    .fontSize(14)
    .text("Order Items", { underline: true })
    .moveDown();
  
  // Table header
  const itemStartX = 50;
  const qtyX = 350;
  const priceX = 450;
  
  doc
    .fontSize(12)
    .text("Item", itemStartX, doc.y)
    .text("Qty", qtyX, doc.y)
    .text("Price", priceX, doc.y)
    .moveDown();
  
  // Draw line below header
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke();
  
  doc.moveDown();
  
  // Items
  if (order.orderDetails && order.orderDetails.items) {
    order.orderDetails.items.forEach(item => {
      const itemDesc = `${item.type} (${item.gender}, Size: ${item.size})`;
      doc
        .text(itemDesc, itemStartX, doc.y)
        .text(item.quantity.toString(), qtyX, doc.y)
        .text(`$${item.price.toFixed(2)}`, priceX, doc.y)
        .moveDown();
    });
  }
  
  // Add-ons
  if (order.orderDetails && order.orderDetails.addOns && order.orderDetails.addOns.length > 0) {
    order.orderDetails.addOns.forEach(addon => {
      doc
        .text(`${addon.name} (Add-on)`, itemStartX, doc.y)
        .text(addon.quantity.toString(), qtyX, doc.y)
        .text(`$${addon.price.toFixed(2)}`, priceX, doc.y)
        .moveDown();
    });
  }
  
  // Draw line below items
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke();
  
  doc.moveDown();
  
  // Total
  doc
    .fontSize(12)
    .text("Total:", 350, doc.y)
    .text(`$${(order.totalAmount / 100).toFixed(2)}`, priceX, doc.y)
    .moveDown(2);
  
  // Footer
  doc
    .fontSize(10)
    .text("Thank you for your order!", { align: "center" })
    .text("If you have any questions, please contact our customer service at support@projersey.com", { align: "center" });
  
  // Finalize PDF
  doc.end();
  
  // Return a Promise that resolves when the file is written
  return new Promise((resolve, reject) => {
    stream.on("finish", () => {
      // Return the relative path from the project root (for easier URL construction)
      resolve(`/output/${fileName}`);
    });
    
    stream.on("error", (err) => {
      reject(err);
    });
  });
}