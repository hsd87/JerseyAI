import { Express, Request, Response } from "express";
import express from "express";
import { storage } from "./storage";
import { insertB2BLeadSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

// Configure multer for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage2,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|svg/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

export function registerPartnerRoutes(app: Express) {
  // POST /api/partner - Submit a partner lead form
  app.post("/api/partner", upload.single("logo"), async (req: Request, res: Response) => {
    try {
      // Parse and validate form data
      const formData = req.body;
      
      // Add logo URL if a file was uploaded
      if (req.file) {
        formData.logoUrl = `/uploads/${req.file.filename}`;
      }
      
      // Convert needsCustomBranding from string to boolean
      if (formData.needsCustomBranding) {
        formData.needsCustomBranding = formData.needsCustomBranding === "true" || formData.needsCustomBranding === "yes";
      }
      
      // Validate the data against our schema
      const validatedData = insertB2BLeadSchema.parse(formData);
      
      // Save to database
      const lead = await storage.createB2BLead(validatedData);
      
      // Here you would typically trigger a notification webhook
      // or send an email to the team for follow-up
      // For example: await sendTeamNotification(lead);
      
      res.status(201).json({
        success: true,
        message: "Thank you! Our team will contact you within 24 hours.",
        id: lead.id
      });
    } catch (error: any) {
      console.error("Error saving partner lead:", error);
      
      // Check if it's a validation error
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Form validation failed",
          errors: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: "An error occurred while submitting your information. Please try again."
      });
    }
  });
  
  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    // Add cache headers
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
    next();
  });
  
  // Static file serving is handled by the main express app in index.ts
}