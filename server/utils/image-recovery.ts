import fs from 'fs';
import path from 'path';
import { db } from '../db'; 
import { and, eq, isNull, not } from 'drizzle-orm';
import { designs } from '@shared/schema';

/**
 * Verify image files for all design records
 * Checks if image paths in database records actually exist in the filesystem
 */
export async function verifyImagePaths() {
    try {
      // Get all designs with image URLs
      const allDesigns = await db.select({
        id: designs.id,
        urls: designs.imageUrls,
      })
      .from(designs)
      .where(not(isNull(designs.imageUrls)));
      
      const missingImages: {
        designId: number;
        imagePath: string;
        fullPath: string;
      }[] = [];
      
      // Check each design's images
      for (const design of allDesigns) {
        const designId = Number(design.id);
        const urls = design.urls as { front: string, back: string };
        
        // Check front image
        if (urls.front) {
          const frontPath = urls.front.startsWith('/') 
            ? urls.front.substring(1) 
            : urls.front;
            
          const fullFrontPath = path.join(process.cwd(), frontPath);
          
          if (!fs.existsSync(fullFrontPath)) {
            missingImages.push({
              designId,
              imagePath: frontPath,
              fullPath: fullFrontPath
            });
          }
        }
        
        // Check back image
        if (urls.back) {
          const backPath = urls.back.startsWith('/') 
            ? urls.back.substring(1) 
            : urls.back;
            
          const fullBackPath = path.join(process.cwd(), backPath);
          
          if (!fs.existsSync(fullBackPath)) {
            missingImages.push({
              designId,
              imagePath: backPath,
              fullPath: fullBackPath
            });
          }
        }
      }
      
      return {
        success: true,
        message: missingImages.length > 0 
          ? `Found ${missingImages.length} missing image files across ${allDesigns.length} designs` 
          : "All image files are present",
        total: allDesigns.length,
        missing: missingImages.length,
        details: missingImages
      };
    } catch (error) {
      console.error("Error verifying images:", error);
      return {
        success: false,
        message: `Error verifying images: ${error.message}`,
        total: 0,
        missing: 0
      };
    }
  }
  
  /**
   * Attempt to recover missing image files using alternative sources
   * This searches backup directories and creates necessary folders
   */
  async recoverMissingImages() {
    try {
      // First verify to get missing images
      const verificationResult = await this.verifyImageFiles();
      
      if (!verificationResult.success) {
        return {
          success: false,
          message: "Verification failed: " + verificationResult.message,
          total: 0,
          missing: 0,
          recovered: 0
        };
      }
      
      if (verificationResult.missing === 0) {
        return {
          success: true,
          message: "No missing images to recover",
          total: verificationResult.total,
          missing: 0,
          recovered: 0
        };
      }
      
      // List of potential backup locations to check
      const backupLocations = [
        path.join(process.cwd(), 'backups', 'images'),
        path.join(process.cwd(), 'data', 'jersey-images')
      ];
      
      let recoveredCount = 0;
      const details = [];
      
      // Try to recover each missing image
      for (const missingImage of verificationResult.details) {
        const filename = path.basename(missingImage.imagePath);
        let recovered = false;
        
        // Search in backup locations
        for (const backupLocation of backupLocations) {
          if (fs.existsSync(backupLocation)) {
            const potentialFiles = fs.readdirSync(backupLocation);
            
            // Look for exact match or similar filename
            const matchingFile = potentialFiles.find(file => file === filename);
            
            if (matchingFile) {
              // Ensure target directory exists
              const targetDir = path.dirname(missingImage.fullPath);
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }
              
              // Copy file from backup to original location
              fs.copyFileSync(
                path.join(backupLocation, matchingFile),
                missingImage.fullPath
              );
              
              recoveredCount++;
              recovered = true;
              
              details.push({
                designId: missingImage.designId,
                status: 'recovered',
                source: path.join(backupLocation, matchingFile),
                destination: missingImage.fullPath
              });
              
              break; // Found and recovered this image, move to next
            }
          }
        }
        
        if (!recovered) {
          details.push({
            designId: missingImage.designId,
            status: 'not-found',
            path: missingImage.imagePath
          });
        }
      }
      
      return {
        success: true,
        message: `Recovered ${recoveredCount} of ${verificationResult.missing} missing images`,
        total: verificationResult.total,
        missing: verificationResult.missing,
        recovered: recoveredCount,
        details
      };
      
    } catch (error) {
      console.error("Error recovering images:", error);
      return {
        success: false,
        message: `Error recovering images: ${error.message}`,
        total: 0,
        missing: 0,
        recovered: 0
      };
    }
  }
}