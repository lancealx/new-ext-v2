#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function copyFileSync(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

function copyDirectorySync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectorySync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('Building React app...');
  
  // Build the React app
  execSync('npx vite build --config vite.app.config.ts', { stdio: 'inherit' });
  
  console.log('Copying React app files...');
  
  // Copy index.html
  copyFileSync(path.join('dist', 'app', 'index.html'), path.join('dist', 'index.html'));
  
  // Copy assets directory
  const appAssetsPath = path.join('dist', 'app', 'assets');
  const distAssetsPath = path.join('dist', 'assets');
  
  if (fs.existsSync(appAssetsPath)) {
    copyDirectorySync(appAssetsPath, distAssetsPath);
  }
  
  // Update index.html to use relative paths
  const indexHtmlPath = path.join('dist', 'index.html');
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Fix paths to be relative
  indexHtml = indexHtml.replace(/href="\/([^"]+)"/g, 'href="$1"');
  indexHtml = indexHtml.replace(/src="\/([^"]+)"/g, 'src="$1"');
  
  // Update title
  indexHtml = indexHtml.replace(/<title>.*?<\/title>/, '<title>Nano Loan Origination Extension</title>');
  
  fs.writeFileSync(indexHtmlPath, indexHtml);
  
  // Clean up temporary app build directory
  const tempAppPath = path.join('dist', 'app');
  if (fs.existsSync(tempAppPath)) {
    fs.rmSync(tempAppPath, { recursive: true, force: true });
  }
  
  console.log('React app build completed successfully!');
  
} catch (error) {
  console.error('Error building React app:', error);
  process.exit(1);
} 