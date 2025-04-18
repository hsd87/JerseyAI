import fs from 'fs';
import path from 'path';
import { db } from '../db'; 
import { and, eq, isNull, not, or } from 'drizzle-orm';
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
      frontUrl: designs.frontImageUrl,
      backUrl: designs.backImageUrl,
    })
    .from(designs)
    .where(
      and(
        not(isNull(designs.frontImageUrl)),
        not(eq(designs.frontImageUrl, ''))
      )
    );
    
    const missingImages: {
      designId: number;
      imagePath: string;
      fullPath: string;
    }[] = [];
    
    // Check each design's images
    for (const design of allDesigns) {
      const designId = Number(design.id);
      
      // Check front image
      if (design.frontUrl) {
        const frontPath = design.frontUrl.startsWith('/') 
          ? design.frontUrl.substring(1) 
          : design.frontUrl;
          
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
      if (design.backUrl) {
        const backPath = design.backUrl.startsWith('/') 
          ? design.backUrl.substring(1) 
          : design.backUrl;
          
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
      message: `Error verifying images: ${error instanceof Error ? error.message : "Unknown error"}`,
      total: 0,
      missing: 0
    };
  }
}

/**
 * Attempt to recover missing image files using alternative sources
 * This searches backup directories and creates necessary folders
 */
export async function reconcileImageFiles() {
  try {
    // First verify to get missing images
    const verificationResult = await verifyImagePaths();
    
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
      path.join(process.cwd(), 'data', 'jersey-images'),
      path.join(process.cwd(), 'output', 'jersey-images')
    ];
    
    let recoveredCount = 0;
    const details = [];
    
    // Try to recover each missing image
    for (const missingImage of verificationResult.details || []) {
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
    
    // If we found data but couldn't recover from file system, 
    // check if designs have base64 image data that we can use to recreate files
    if (recoveredCount < verificationResult.missing) {
      const unresolvedDesigns = details
        .filter(item => item.status === 'not-found')
        .map(item => item.designId);
      
      if (unresolvedDesigns.length > 0) {
        // Get designs with image data
        // Get designs with image data for the unresolved designs
        // To avoid complex OR operations in the query, we'll run multiple simpler queries
        const designsWithImageData = [];
        
        for (const designId of unresolvedDesigns) {
          // Query for each design individually to simplify query structure
          const [design] = await db.select({
            id: designs.id,
            frontUrl: designs.frontImageUrl,
            backUrl: designs.backImageUrl,
            frontData: designs.frontImageData,
            backData: designs.backImageData
          })
          .from(designs)
          .where(
            and(
              eq(designs.id, designId),
              not(isNull(designs.frontImageData)),
              not(eq(designs.frontImageData, ''))
            )
          );
          
          if (design) {
            designsWithImageData.push(design);
          }
        }
        
        for (const design of designsWithImageData) {
          // Find the corresponding missing images
          const frontMissing = details.find(
            item => item.designId === design.id && 
            item.status === 'not-found' && 
            item.path && design.frontUrl && 
            item.path === (design.frontUrl.startsWith('/') 
              ? design.frontUrl.substring(1) 
              : design.frontUrl)
          );
          
          const backMissing = details.find(
            item => item.designId === design.id && 
            item.status === 'not-found' && 
            item.path && design.backUrl && 
            item.path === (design.backUrl.startsWith('/') 
              ? design.backUrl.substring(1) 
              : design.backUrl)
          );
          
          // Recover front image from base64 data if available
          if (frontMissing && design.frontData && design.frontData.trim() !== '') {
            const targetDir = path.dirname(frontMissing.path);
            if (!fs.existsSync(path.join(process.cwd(), targetDir))) {
              fs.mkdirSync(path.join(process.cwd(), targetDir), { recursive: true });
            }
            
            // Handle base64 data safely by removing any prefixes like "data:image/png;base64,"
            let base64Data = design.frontData;
            if (base64Data.includes(';base64,')) {
              base64Data = base64Data.split(';base64,')[1];
            }
            
            const buffer = Buffer.from(base64Data, 'base64');
            fs.writeFileSync(path.join(process.cwd(), frontMissing.path), buffer);
            
            // Update status
            frontMissing.status = 'recovered-from-data';
            recoveredCount++;
          }
          
          // Recover back image from base64 data if available
          if (backMissing && design.backData && design.backData.trim() !== '') {
            const targetDir = path.dirname(backMissing.path);
            if (!fs.existsSync(path.join(process.cwd(), targetDir))) {
              fs.mkdirSync(path.join(process.cwd(), targetDir), { recursive: true });
            }
            
            // Handle base64 data safely by removing any prefixes
            let base64Data = design.backData;
            if (base64Data.includes(';base64,')) {
              base64Data = base64Data.split(';base64,')[1];
            }
            
            const buffer = Buffer.from(base64Data, 'base64');
            fs.writeFileSync(path.join(process.cwd(), backMissing.path), buffer);
            
            // Update status
            backMissing.status = 'recovered-from-data';
            recoveredCount++;
          }
        }
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
      message: `Error recovering images: ${error instanceof Error ? error.message : "Unknown error"}`,
      total: 0,
      missing: 0,
      recovered: 0
    };
  }
}