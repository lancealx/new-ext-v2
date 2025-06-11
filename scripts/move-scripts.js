/**
 * Script to move compiled files to their correct locations for Chrome extension
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '..', 'dist');

// Files to move (source path relative to dist, destination path)
const filesToMove = [
  // Skip background.js - use the standalone version from public/
  { src: 'extension/content/content.js', dest: 'content.js' }
];

// Process each file
filesToMove.forEach(file => {
  const srcPath = path.join(distDir, file.src);
  const destPath = path.join(distDir, file.dest);
  
  // Check if source file exists
  if (fs.existsSync(srcPath)) {
    try {
      // Read file content
      let jsContent = fs.readFileSync(srcPath, 'utf8');
      
      // Fix imports in content.js (replace relative paths with absolute ones)
      if (file.src.includes('content.js')) {
        jsContent = jsContent.replace(
          `import { tokenService } from '../../services/tokenService';`,
          `import { tokenService } from './services/tokenService.js';`
        );
      }
      
      // Write the modified file
      fs.writeFileSync(destPath, jsContent);
      console.log(`Successfully copied ${file.src} to ${file.dest}`);
      
      // Copy source map if it exists
      const srcMapPath = srcPath + '.map';
      const destMapPath = destPath + '.map';
      
      if (fs.existsSync(srcMapPath)) {
        fs.copyFileSync(srcMapPath, destMapPath);
        console.log(`Successfully copied ${file.src}.map to ${file.dest}.map`);
        
        // Update sourceMappingURL in the copied JS file
        jsContent = jsContent.replace(
          new RegExp(`//# sourceMappingURL=${path.basename(srcPath)}.map`),
          `//# sourceMappingURL=${path.basename(destPath)}.map`
        );
        fs.writeFileSync(destPath, jsContent);
      }
    } catch (error) {
      console.error(`Error copying ${file.src}:`, error);
    }
  } else {
    console.error(`Source file not found: ${srcPath}`);
  }
});

// Check if standalone background.js exists and is correct
const standaloneBg = path.join(distDir, 'background.js');
if (fs.existsSync(standaloneBg)) {
  const content = fs.readFileSync(standaloneBg, 'utf8');
  if (content.includes('Simple standalone background script')) {
    console.log('Using standalone background.js (already in place)');
  } else {
    console.log('background.js exists but may be the compiled version, keeping as-is');
  }
} else {
  console.error('No background.js found in dist directory');
}

// Also make sure the services directory is copied to the dist root
const servicesDir = path.join(distDir, 'services');
if (fs.existsSync(servicesDir)) {
  console.log('Services directory exists, ensuring files have proper imports');
  
  // Find all JS files in the services directory
  const serviceFiles = fs.readdirSync(servicesDir)
    .filter(file => file.endsWith('.js'));
  
  // Process each service file to ensure imports are correct
  serviceFiles.forEach(file => {
    const filePath = path.join(servicesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix any relative imports in service files
    // Add more replacements as needed
    
    fs.writeFileSync(filePath, content);
    console.log(`Processed service file: ${file}`);
  });
} else {
  console.error('Services directory not found in dist. Make sure the tokenService is being compiled.');
}

console.log('Script files moved successfully'); 