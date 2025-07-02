import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the service worker file
const serviceWorkerPath = path.join(__dirname, '../dist/serviceWorker.js');
const serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');

// Find the import path
const importMatch = serviceWorkerContent.match(/import "(.+)";/);
if (importMatch) {
  const importPath = importMatch[1];
  const fullImportPath = path.join(__dirname, '../dist', importPath);
  
  // Read the background script content
  const backgroundContent = fs.readFileSync(fullImportPath, 'utf8');
  
  // Replace the import with the actual content
  const fixedContent = backgroundContent;
  
  // Write the fixed service worker
  fs.writeFileSync(serviceWorkerPath, fixedContent);
  
  console.log('✅ Service worker fixed successfully');
} else {
  console.log('⚠️ No import found in service worker');
}

// Fix the manifest.json to remove "type": "module" from background
const manifestPath = path.join(__dirname, '../dist/manifest.json');
const manifestContent = fs.readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(manifestContent);

if (manifest.background && manifest.background.type === 'module') {
  delete manifest.background.type;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Manifest fixed successfully');
} 