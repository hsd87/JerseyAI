import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { Order, User } from '@shared/schema';

// Choose whether to use SendGrid or Nodemailer based on environment configuration
const useSendGrid = process.env.SENDGRID_API_KEY ? true : false;

// Initialize SendGrid if available
if (useSendGrid && process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Fallback nodemailer transporter for development (can be configured for production use as well)
const createNodemailerTransport = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send an order confirmation email with PDF attachment
 * 
 * @param user User receiving the email
 * @param order Order details
 * @param pdfPath Path to the PDF file
 * @returns Success status and message ID if available
 */
export const sendOrderConfirmationEmail = async (
  user: User,
  order: Order,
  pdfPath: string
): Promise<{ success: boolean; messageId?: string }> => {
  if (!user.email) {
    console.error('Cannot send email: User email is not available');
    return { success: false };
  }

  try {
    // Read the PDF file for attachment
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    // Format price for display
    const formatPrice = (cents: number) => (cents / 100).toFixed(2);
    
    // Extract receipt URL from order metadata if available
    let receiptUrl = '';
    if (order.metadata && typeof order.metadata === 'string') {
      try {
        const metadata = JSON.parse(order.metadata);
        receiptUrl = metadata.stripeReceiptUrl || '';
      } catch (e) {
        console.error("Error parsing order metadata:", e);
      }
    }
    
    // Set up estimated delivery date (2 weeks from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 14);
    const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Create email content
    const emailSubject = `Your ProJersey Order #${order.id} is confirmed!`;
    
    // HTML email body
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { color: #0071e3; font-size: 28px; font-weight: bold; }
            .order-number { font-size: 18px; color: #555; margin-top: 15px; }
            .main { background: #f9f9f9; border-radius: 6px; padding: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #0071e3; }
            .item { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .total { font-weight: bold; margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; }
            .delivery-info { background: #e8f4ff; padding: 15px; border-radius: 6px; margin-bottom: 25px; }
            .footer { text-align: center; color: #777; font-size: 14px; margin-top: 40px; }
            .button { display: inline-block; background: #0071e3; color: white; text-decoration: none; padding: 10px 25px; border-radius: 6px; margin-top: 15px; }
            .discount { color: #2e8540; }
            @media (max-width: 480px) {
              body { padding: 10px; }
              .main { padding: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">ProJersey</div>
            <div class="order-number">Order #${order.id}</div>
          </div>
          
          <div class="main">
            <p>Hello ${user.username || user.email.split('@')[0]},</p>
            <p>Thank you for your order! We're excited to create your custom ${order.sport} apparel. Below is a summary of your purchase:</p>
            
            <div class="section">
              <div class="section-title">Order Summary</div>
              
              ${order.orderDetails?.items?.map(item => `
                <div class="item">
                  <div>${item.type} (${item.gender}, Size: ${item.size}) × ${item.quantity}</div>
                  <div>$${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              `).join('') || ''}
              
              ${order.orderDetails?.addOns?.map(addon => `
                <div class="item">
                  <div>${addon.name} (Add-on) × ${addon.quantity}</div>
                  <div>$${(addon.price * addon.quantity).toFixed(2)}</div>
                </div>
              `).join('') || ''}
              
              <div class="total">
                <div class="item">
                  <div>Total</div>
                  <div>$${formatPrice(order.totalAmount)}</div>
                </div>
              </div>
            </div>
            
            <div class="delivery-info">
              <div class="section-title">Delivery Information</div>
              <p>We'll be working on your custom order right away. Your estimated delivery date is: <strong>${formattedDeliveryDate}</strong></p>
              <p>You'll receive shipping updates when your order ships.</p>
            </div>
            
            <div class="section">
              <div class="section-title">Shipping Address</div>
              <p>
                ${order.shippingAddress?.name}<br>
                ${order.shippingAddress?.street}<br>
                ${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.zip}<br>
                ${order.shippingAddress?.country}
              </p>
            </div>
            
            ${receiptUrl ? `
              <div style="text-align: center; margin-top: 20px;">
                <a href="${receiptUrl}" class="button" target="_blank">View Payment Receipt</a>
              </div>
            ` : ''}
          </div>
          
          <p>We've attached a detailed invoice to this email for your records.</p>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team at <a href="mailto:support@projersey.com">support@projersey.com</a>.</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} ProJersey. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
    
    // Plain text version
    const textContent = `
      ProJersey - Order #${order.id}
      
      Hello ${user.username || user.email.split('@')[0]},
      
      Thank you for your order! We're excited to create your custom ${order.sport} apparel.
      
      Order Summary:
      ${order.orderDetails?.items?.map(item => `- ${item.type} (${item.gender}, Size: ${item.size}) × ${item.quantity}: $${(item.price * item.quantity).toFixed(2)}`).join('\n') || ''}
      ${order.orderDetails?.addOns?.map(addon => `- ${addon.name} (Add-on) × ${addon.quantity}: $${(addon.price * addon.quantity).toFixed(2)}`).join('\n') || ''}
      
      Total: $${formatPrice(order.totalAmount)}
      
      Delivery Information:
      Your estimated delivery date is: ${formattedDeliveryDate}
      
      Shipping Address:
      ${order.shippingAddress?.name}
      ${order.shippingAddress?.street}
      ${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.zip}
      ${order.shippingAddress?.country}
      
      We've attached a detailed invoice to this email for your records.
      
      If you have any questions or need assistance, please don't hesitate to contact our support team at support@projersey.com.
      
      © ${new Date().getFullYear()} ProJersey. All rights reserved.
    `;
    
    // Send the email using the appropriate service
    if (useSendGrid) {
      // Use SendGrid
      const msg = {
        to: user.email,
        from: 'orders@projersey.com',
        subject: emailSubject,
        text: textContent,
        html: htmlContent,
        attachments: [
          {
            content: pdfBase64,
            filename: `ProJersey_Order_${order.id}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment',
          },
        ],
      };
      
      const result = await sgMail.send(msg);
      return {
        success: true,
        messageId: result[0]?.headers['x-message-id'],
      };
    } else {
      // Use Nodemailer
      const transporter = createNodemailerTransport();
      
      const result = await transporter.sendMail({
        from: 'orders@projersey.com',
        to: user.email,
        subject: emailSubject,
        text: textContent,
        html: htmlContent,
        attachments: [
          {
            filename: `ProJersey_Order_${order.id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
      
      return {
        success: true,
        messageId: result.messageId,
      };
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false };
  }
};