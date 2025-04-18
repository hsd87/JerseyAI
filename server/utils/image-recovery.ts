import fs from 'fs';
import path from 'path';
import { storage } from '../storage';
import { db } from '../db';
import { designs } from '@shared/schema';
import { eq } from 'drizzle-orm';

const OUTPUT_DIR = path.resolve('./output');

/**
 * Utility to scan the output directory and reconcile image files with database records
 * This helps recover from situations where database records don't match filesystem state
 */
export async function reconcileImageFiles() {
  console.log('Starting image file reconciliation...');
  
  try {
    // 1. Get all designs from the database
    const allDesigns = await storage.getAllDesigns();
    console.log(`Found ${allDesigns.length} designs in database`);
    
    // 2. Find designs with missing image URLs
    const designsWithMissingImages = allDesigns.filter(
      design => !design.frontImageUrl || design.frontImageUrl === '' || 
                !design.backImageUrl || design.backImageUrl === ''
    );
    
    console.log(`Found ${designsWithMissingImages.length} designs with missing image URLs`);
    
    // 3. Scan the output directory for image files
    const files = fs.readdirSync(OUTPUT_DIR);
    const jerseyFiles = files.filter(file => file.startsWith('jersey_'));
    
    console.log(`Found ${jerseyFiles.length} jersey image files in output directory`);
    
    // 4. Extract UUIDs from filenames
    const fileUuids = jerseyFiles.map(filename => {
      // Extract UUID from filenames like jersey_766a8a98-1807-4381-9ab9-096dc87d33a0.png
      const match = filename.match(/jersey_([0-9a-f-]+)\.png$/i);
      return match ? match[1] : null;
    }).filter(Boolean);
    
    console.log(`Extracted ${fileUuids.length} valid UUIDs from filenames`);
    
    // 5. Update designs with missing images where possible
    let updatedCount = 0;
    
    for (const design of designsWithMissingImages) {
      // Look for filenames that might match this design
      // For simplicity, we'll use the most recent matching file
      const potentialMatches = jerseyFiles.filter(file => {
        // Match by design ID or creation date pattern
        return file.includes(design.id.toString()) || 
               (design.createdAt && file.includes(new Date(design.createdAt).toISOString().split('T')[0].replace(/-/g, '')));
      });
      
      if (potentialMatches.length > 0) {
        // Use the most recently modified file
        const mostRecentFile = potentialMatches.sort((a, b) => {
          const statA = fs.statSync(path.join(OUTPUT_DIR, a));
          const statB = fs.statSync(path.join(OUTPUT_DIR, b));
          return statB.mtime.getTime() - statA.mtime.getTime();
        })[0];
        
        // Build paths for front and back images (same file for both in this system)
        const imagePath = `/output/${mostRecentFile}`;
        
        // Update the design record
        await db.update(designs)
          .set({ 
            frontImageUrl: imagePath,
            backImageUrl: imagePath
          })
          .where(eq(designs.id, design.id));
        
        console.log(`Updated design ${design.id} with image path: ${imagePath}`);
        updatedCount++;
      }
    }
    
    console.log(`Reconciliation complete. Updated ${updatedCount} designs with recovered image paths.`);
    return {
      total: allDesigns.length,
      missing: designsWithMissingImages.length,
      recovered: updatedCount
    };
  } catch (error) {
    console.error('Error during image reconciliation:', error);
    throw error;
  }
}

/**
 * Verifies that all image URLs in the database point to existing files
 * Reports any discrepancies for further investigation
 */
export async function verifyImagePaths() {
  console.log('Verifying image paths in database...');
  
  try {
    // Get all designs with image URLs
    const allDesigns = await storage.getAllDesigns();
    const designsWithImages = allDesigns.filter(
      design => design.frontImageUrl && design.frontImageUrl !== ''
    );
    
    console.log(`Checking ${designsWithImages.length} designs with image URLs`);
    
    const missingFiles = [];
    
    // Check each image URL to ensure the file exists
    for (const design of designsWithImages) {
      // We've already filtered out null/empty strings above, but TypeScript doesn't know that
      // so we add an extra check here to satisfy the compiler
      if (design.frontImageUrl) {
        const frontImagePath = design.frontImageUrl.replace(/^\/output\//, '');
        const fullPath = path.join(OUTPUT_DIR, frontImagePath);
        
        if (!fs.existsSync(fullPath)) {
          missingFiles.push({
            designId: design.id,
            imagePath: design.frontImageUrl,
            fullPath
          });
        }
      }
    }
    
    console.log(`Found ${missingFiles.length} designs with missing image files`);
    
    return {
      total: designsWithImages.length,
      missing: missingFiles.length,
      details: missingFiles
    };
  } catch (error) {
    console.error('Error during image path verification:', error);
    throw error;
  }
}