/**
 * Script to create placeholder icon files for the extension
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define icon sizes and paths
const iconSizes = [16, 48, 128];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure the icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log(`Created directory: ${iconsDir}`);
}

// Function to create a simple PNG icon
// This is a very basic placeholder that creates a colored square
// In a real project, you would use proper icon files
function createPlaceholderIcon(size, outputPath) {
  // Create a 1x1 pixel buffer with the color #2196F3 (blue)
  // Real icons should be created using proper image libraries or design tools
  const header = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // "IHDR"
    0x00, 0x00, 0x00, size >> 8, size & 0xff, // width
    0x00, 0x00, 0x00, size >> 8, size & 0xff, // height
    0x08, // bit depth
    0x06, // color type (RGBA)
    0x00, // compression method
    0x00, // filter method
    0x00, // interlace method
    0x00, 0x00, 0x00, 0x00, // CRC (not accurate but works for placeholder)
    0x00, 0x00, 0x00, 0x01, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // "IDAT"
    0x08, // Data byte (compressed)
    0x00, 0x00, 0x00, 0x00, // CRC (not accurate but works for placeholder)
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // "IEND"
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);

  fs.writeFileSync(outputPath, header);
  console.log(`Created placeholder icon: ${outputPath}`);
}

// Create icons for each size
iconSizes.forEach(size => {
  const iconPath = path.join(iconsDir, `icon${size}.png`);
  createPlaceholderIcon(size, iconPath);
});

console.log('Icon creation complete'); 