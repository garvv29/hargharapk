#!/usr/bin/env node

/**
 * Bundling Fix Script for HarGharMunga App
 * Fixes dependency resolution issues
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Fixing bundling issues...\n');

// Step 1: Clear all caches
console.log('1. Clearing caches...');
try {
  // Clear Expo cache
  execSync('npx expo install --fix', { stdio: 'inherit' });
  
  // Clear npm cache
  execSync('npm cache clean --force', { stdio: 'inherit' });
  
  console.log('✅ Caches cleared');
} catch (error) {
  console.log('⚠️  Cache clearing had issues, continuing...');
}

// Step 2: Reinstall problematic dependencies
console.log('\n2. Reinstalling dependencies...');
try {
  execSync('npm install simple-swizzle is-arrayish', { stdio: 'inherit' });
  console.log('✅ Dependencies reinstalled');
} catch (error) {
  console.log('❌ Error reinstalling dependencies:', error.message);
}

// Step 3: Check package.json for any issues
console.log('\n3. Checking package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Add missing resolutions if needed
  if (!packageJson.resolutions) {
    packageJson.resolutions = {};
  }
  
  packageJson.resolutions['is-arrayish'] = '^0.3.2';
  packageJson.resolutions['simple-swizzle'] = '^0.2.2';
  
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✅ Package.json updated with resolutions');
} catch (error) {
  console.log('❌ Error updating package.json:', error.message);
}

// Step 4: Final dependency check
console.log('\n4. Running final dependency check...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies verified');
} catch (error) {
  console.log('❌ Error verifying dependencies:', error.message);
}

console.log('\n🎉 Bundling fix complete!');
console.log('Now restart the development server with: npm start');
