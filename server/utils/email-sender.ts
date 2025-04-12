import nodemailer from 'nodemailer';
import { Order, User } from '@shared/schema';
import fs from 'fs-extra';

// Create a test account if no SMTP credentials are provided
let testAccount: nodemailer.TestAccount | null = null;

/**
 * Get a configured email transporter
 * In production, real SMTP credentials should be used
 */
async function getTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Use real SMTP credentials if provided
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Use ethereal email for testing if no credentials are provided
    if (!testAccount) {
      testAccount = await nodemailer.createTestAccount();
    }
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
}

/**
 * Sends an order confirmation email to the user
 * @param user The user who placed the order
 * @param order The order data
 * @param pdfPath Path to the generated PDF file
 * @returns Information about the sent email
 */
export async function sendOrderConfirmationEmail(user: User, order: Order, pdfPath: string) {
  if (!user.email) {
    throw new Error('User email is missing, cannot send confirmation email');
  }

  const transporter = await getTransporter();
  
  // Format pricing
  const totalAmount = (order.totalAmount / 100).toFixed(2);
  
  // Create email content
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4a5568; text-align: center; margin-bottom: 30px;">Your ProJersey Order Has Been Confirmed!</h1>
      
      <p style="font-size: 16px; line-height: 1.5; color: #2d3748;">
        Hi ${user.username},
      </p>
      
      <p style="font-size: 16px; line-height: 1.5; color: #2d3748;">
        Thank you for your order with ProJersey! We're excited to create your custom jersey.
      </p>
      
      <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h2 style="color: #4a5568; font-size: 18px; margin-top: 0;">Order Summary:</h2>
        <p><strong>Order ID:</strong> ${order.uuid}</p>
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        <p><strong>Total Amount:</strong> $${totalAmount}</p>
        <p><strong>Sport:</strong> ${order.sport}</p>
        <p><strong>Package:</strong> ${order.orderDetails?.packageType || 'Custom Package'}</p>
        <p><strong>Estimated Delivery:</strong> ${order.orderDetails?.deliveryTimeline || '2-3 weeks'}</p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.5; color: #2d3748;">
        We've attached a PDF with all the details of your order for your records.
      </p>
      
      <p style="font-size: 16px; line-height: 1.5; color: #2d3748;">
        If you have any questions or need to make changes to your order, please contact our
        customer service team at <a href="mailto:support@projersey.com">support@projersey.com</a>.
      </p>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 14px; color: #718096;">
          &copy; 2024 ProJersey | <a href="#" style="color: #4299e1;">Terms & Conditions</a>
        </p>
      </div>
    </div>
  `;
  
  // Prepare email with PDF attachment
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"ProJersey" <orders@projersey.com>',
    to: user.email,
    subject: '🎽 Your ProJersey Order Has Been Confirmed!',
    html: emailHtml,
    attachments: [
      {
        filename: `order_${order.uuid}.pdf`,
        content: await fs.readFile(pdfPath),
        contentType: 'application/pdf',
      },
    ],
  };
  
  // Send the email
  const info = await transporter.sendMail(mailOptions);
  
  // For test accounts, log the preview URL
  if (testAccount) {
    console.log('Email preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
  
  return info;
}

export default {
  sendOrderConfirmationEmail,
};