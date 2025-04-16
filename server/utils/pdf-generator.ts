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
  // Create both output directories if they don't exist
  const outputDir = path.join(process.cwd(), "output");
  const orderPdfDir = path.join(process.cwd(), "orders", "pdfs");
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  if (!fs.existsSync(orderPdfDir)) {
    fs.mkdirSync(orderPdfDir, { recursive: true });
  }

  // Create PDF filename with timestamp
  const timestamp = new Date().getTime();
  const fileName = `order_${timestamp}_${order.userId}.pdf`;
  const filePath = path.join(outputDir, fileName);
  const orderPdfPath = path.join(orderPdfDir, fileName);
  
  // Create PDF with larger margins for better readability
  const doc = new PDFDocument({ 
    margin: 50,
    size: 'A4'
  });
  
  // Pipe PDF to file
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  
  // Add ProJersey branding header
  doc
    .fontSize(28)
    .fillColor('#0071e3')
    .text("ProJersey", { align: "center" })
    .fontSize(14)
    .fillColor('#444444')
    .text("Custom Athletic Apparel", { align: "center" })
    .moveDown()
    .fontSize(18)
    .fillColor('#000000')
    .text("Order Confirmation", { align: "center" })
    .moveDown(1.5);

  // Create a box for order info
  const boxTop = doc.y;
  const boxHeight = 100;
  
  doc
    .rect(50, boxTop, 495, boxHeight)
    .fillAndStroke('#f6f6f6', '#dddddd');
    
  // Order details section
  doc
    .fillColor('#000000')
    .fontSize(12)
    .text(`Order Number: #${order.id}`, 70, boxTop + 20)
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`, 70, boxTop + 40)
    .text(`Status: ${order.status.toUpperCase()}`, 70, boxTop + 60)
    .text(`Sport: ${order.sport.charAt(0).toUpperCase() + order.sport.slice(1)}`, 350, boxTop + 20)
    .moveDown(5);
  
  // Shipping and customer info (two-column layout)
  const startY = doc.y;
  if (order.shippingAddress) {
    doc
      .fontSize(14)
      .fillColor('#0071e3')
      .text("Shipping Information", 50, startY, { underline: true })
      .fillColor('#000000')
      .fontSize(11)
      .text(`Name: ${order.shippingAddress.name}`, 50, startY + 25)
      .text(`Address: ${order.shippingAddress.street}`, 50, startY + 40)
      .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`, 50, startY + 55)
      .text(`Country: ${order.shippingAddress.country}`, 50, startY + 70)
      .text(`Phone: ${order.shippingAddress.phone}`, 50, startY + 85);
  }
  
  // Design preview on the right column if available
  if (order.designUrls) {
    doc
      .fontSize(14)
      .fillColor('#0071e3')
      .text("Design Preview", 300, startY, { underline: true });
      
    try {
      // Include text about design preview instead of actual images
      doc
        .fillColor('#444444')
        .fontSize(11)
        .text("Your custom jersey design", 300, startY + 25)
        .text("(Images available in your account dashboard)", 300, startY + 40);

      // Note: PDFKit can load images, but we'll keep it simple for this version
      // If we had the actual files on disk, we could use:
      // doc.image(order.designUrls.front, 300, startY + 25, { width: 150 });
    } catch (error) {
      console.error("Error adding design images to PDF:", error);
    }
  }
  
  doc.moveDown(6);
  
  // Order items with improved table formatting
  doc
    .fontSize(14)
    .fillColor('#0071e3')
    .text("Order Items", { underline: true })
    .moveDown();
  
  // Table header with background
  const tableTop = doc.y;
  const rowHeight = 20;
  const itemStartX = 50;
  const descX = 200;
  const qtyX = 350;
  const priceX = 430;
  const totalX = 500;
  
  // Draw header background
  doc
    .fillColor('#f0f0f0')
    .rect(itemStartX, tableTop, 500, rowHeight)
    .fill();
  
  // Table header text
  doc
    .fillColor('#000000')
    .fontSize(10)
    .text("ITEM", itemStartX + 5, tableTop + 5)
    .text("DESCRIPTION", descX, tableTop + 5)
    .text("QTY", qtyX, tableTop + 5)
    .text("PRICE", priceX, tableTop + 5)
    .text("TOTAL", totalX, tableTop + 5);
  
  let y = tableTop + rowHeight + 5;
  let totalAmount = 0;
  
  // Items with alternating row colors
  if (order.orderDetails && order.orderDetails.items) {
    order.orderDetails.items.forEach((item, index) => {
      // Alternating row background
      if (index % 2 === 0) {
        doc
          .fillColor('#f9f9f9')
          .rect(itemStartX, y - 5, 500, rowHeight)
          .fill();
      }
      
      const itemType = item.type.charAt(0).toUpperCase() + item.type.slice(1);
      const itemDesc = `${item.gender}'s, Size: ${item.size}`;
      const itemPrice = item.price;
      const lineTotal = itemPrice * item.quantity;
      totalAmount += lineTotal;
      
      doc
        .fillColor('#000000')
        .fontSize(10)
        .text(itemType, itemStartX + 5, y)
        .text(itemDesc, descX, y)
        .text(item.quantity.toString(), qtyX, y)
        .text(`$${itemPrice.toFixed(2)}`, priceX, y)
        .text(`$${lineTotal.toFixed(2)}`, totalX, y);
      
      y += rowHeight;
    });
  }
  
  // Add-ons
  if (order.orderDetails && order.orderDetails.addOns && order.orderDetails.addOns.length > 0) {
    order.orderDetails.addOns.forEach((addon, index) => {
      // Alternating row background continuing from items
      if ((index + (order.orderDetails?.items?.length || 0)) % 2 === 0) {
        doc
          .fillColor('#f9f9f9')
          .rect(itemStartX, y - 5, 500, rowHeight)
          .fill();
      }
      
      const addonName = addon.name.charAt(0).toUpperCase() + addon.name.slice(1);
      const lineTotal = addon.price * addon.quantity;
      totalAmount += lineTotal;
      
      doc
        .fillColor('#000000')
        .fontSize(10)
        .text(addonName, itemStartX + 5, y)
        .text("Add-on Item", descX, y)
        .text(addon.quantity.toString(), qtyX, y)
        .text(`$${addon.price.toFixed(2)}`, priceX, y)
        .text(`$${lineTotal.toFixed(2)}`, totalX, y);
      
      y += rowHeight;
    });
  }
  
  // Draw line below items
  doc
    .strokeColor('#cccccc')
    .lineWidth(1)
    .moveTo(itemStartX, y)
    .lineTo(550, y)
    .stroke();
  
  y += 20;
  
  // Show price breakdown from metadata if available
  if (order.metadata && typeof order.metadata === 'string') {
    try {
      const metadata = JSON.parse(order.metadata);
      if (metadata.priceBreakdown) {
        const breakdown = metadata.priceBreakdown;
        
        // Subtotal
        doc
          .fontSize(10)
          .text("Subtotal:", 400, y)
          .text(`$${(breakdown.baseTotal / 100).toFixed(2)}`, totalX, y);
        y += 15;
        
        // Discounts
        if (breakdown.tierDiscountAmount > 0) {
          doc
            .fillColor('#009900')
            .text(`Quantity Discount (${breakdown.tierDiscountApplied}):`, 400, y)
            .text(`-$${(breakdown.tierDiscountAmount / 100).toFixed(2)}`, totalX, y);
          y += 15;
        }
        
        if (breakdown.subscriptionDiscountAmount > 0) {
          doc
            .fillColor('#009900')
            .text(`Subscriber Discount (${breakdown.subscriptionDiscountApplied}):`, 400, y)
            .text(`-$${(breakdown.subscriptionDiscountAmount / 100).toFixed(2)}`, totalX, y);
          y += 15;
        }
        
        // Shipping
        doc
          .fillColor('#000000')
          .text("Shipping:", 400, y);
          
        if (breakdown.shippingCost === 0) {
          doc.fillColor('#009900').text("FREE", totalX, y);
        } else {
          doc.fillColor('#000000').text(`$${(breakdown.shippingCost / 100).toFixed(2)}`, totalX, y);
        }
        
        y += 20;
        
        // Total with background highlight
        doc
          .fillColor('#f0f0f0')
          .rect(350, y - 5, 200, 25)
          .fill();
        
        doc
          .fillColor('#000000')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text("TOTAL:", 400, y)
          .text(`$${(breakdown.grandTotal / 100).toFixed(2)}`, totalX, y);
      }
    } catch (e) {
      console.error("Error parsing order metadata:", e);
      
      // Fallback to simple total if metadata parsing fails
      doc
        .fillColor('#000000')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text("TOTAL:", 400, y)
        .text(`$${(order.totalAmount / 100).toFixed(2)}`, totalX, y);
    }
  } else {
    // Fallback to simple total if no metadata
    doc
      .fillColor('#000000')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text("TOTAL:", 400, y)
      .text(`$${(order.totalAmount / 100).toFixed(2)}`, totalX, y);
  }
  
  // Reset font to normal
  doc.font('Helvetica');
  
  // Team roster information if applicable
  if (order.orderDetails && order.orderDetails.isTeamOrder && order.orderDetails.teamName) {
    doc.addPage();
    
    doc
      .fontSize(16)
      .fillColor('#0071e3')
      .text("Team Order Details", { align: "center" })
      .moveDown();
      
    doc
      .fontSize(12)
      .fillColor('#000000')
      .text(`Team Name: ${order.orderDetails.teamName}`)
      .moveDown();
      
    // If we had roster information in the order, we would add it here
    // This would be implementing a feature like:
    // if (order.orderDetails.roster) { ... }
  }
  
  // Final page with delivery info
  if (doc.y > 650) {
    doc.addPage();
  } else {
    doc.moveDown(4);
  }
  
  // Delivery timeline
  if (order.orderDetails && order.orderDetails.deliveryTimeline) {
    doc
      .fontSize(12)
      .fillColor('#444444')
      .text(`Estimated Delivery: ${order.orderDetails.deliveryTimeline}`, { align: "center" })
      .moveDown();
  } else {
    doc
      .fontSize(12)
      .fillColor('#444444')
      .text("Estimated Delivery: 2-3 weeks from order confirmation", { align: "center" })
      .moveDown();
  }
  
  // Footer
  doc
    .fontSize(10)
    .fillColor('#666666')
    .text("Thank you for your order!", { align: "center" })
    .moveDown(0.5)
    .text("If you have any questions, please contact our customer service at:", { align: "center" })
    .fillColor('#0071e3')
    .text("support@projersey.com", { align: "center" })
    .moveDown(0.5)
    .fillColor('#666666')
    .text(`Order ID: ${order.id} • Generated on ${new Date().toLocaleString()}`, { align: "center" });
  
  // Finalize PDF
  doc.end();
  
  // Return a Promise that resolves when the file is written and copied
  return new Promise((resolve, reject) => {
    stream.on("finish", () => {
      try {
        // Copy the file to the orders/pdfs directory
        fs.copyFileSync(filePath, orderPdfPath);
        console.log(`PDF copied to ${orderPdfPath}`);
        
        // Return the URL path for the PDF
        resolve(`/orders/pdfs/${fileName}`);
      } catch (err) {
        console.error('Error copying PDF file:', err);
        reject(err);
      }
    });
    
    stream.on("error", (err) => {
      console.error('Error writing PDF file:', err);
      reject(err);
    });
  });
}