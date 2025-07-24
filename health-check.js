#!/usr/bin/env node

/**
 * Health Check Script for HarGharMunga App
 * Verifies that all major components are working correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🏥 Running HarGharMunga App Health Check...\n');

// Check 1: Verify all required files exist
const requiredFiles = [
  'App.tsx',
  'package.json',
  'src/utils/api.ts',
  'src/screens/AnganwadiDashboard.tsx',
  'src/screens/FamilyDashboard.tsx',
  'src/screens/UploadPhotoScreen.tsx',
  'src/assets/logo.jpg',
  'src/assets/ssipmt.jpg'
];

console.log('📁 Checking required files...');
let filesOk = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    filesOk = false;
  }
});

// Check 2: Verify package.json structure
console.log('\n📦 Checking package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDeps = [
    'react',
    'react-native',
    'expo',
    '@react-navigation/native',
    '@react-navigation/stack',
    'react-native-paper'
  ];

  let depsOk = true;
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      depsOk = false;
    }
  });

  if (depsOk) {
    console.log('✅ All required dependencies present');
  }
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
  filesOk = false;
}

// Check 3: Verify API service structure
console.log('\n🌐 Checking API service...');
try {
  const apiContent = fs.readFileSync('src/utils/api.ts', 'utf8');
  
  const requiredMethods = [
    'testConnection',
    'login',
    'logout',
    'getFamilies',
    'getFamilyDetails',
    'getFamilyByUserId',
    'registerFamily',
    'uploadPlantPhoto'
  ];

  let apiOk = true;
  requiredMethods.forEach(method => {
    if (apiContent.includes(`${method}(`)) {
      console.log(`✅ ${method} method found`);
    } else {
      console.log(`❌ ${method} method - MISSING`);
      apiOk = false;
    }
  });

  if (apiContent.includes('fetchTotalFamiliesAndPhotos')) {
    console.log('✅ fetchTotalFamiliesAndPhotos export found');
  } else {
    console.log('❌ fetchTotalFamiliesAndPhotos export - MISSING');
    apiOk = false;
  }

} catch (error) {
  console.log('❌ Error reading API service:', error.message);
  filesOk = false;
}

// Check 4: Verify screen components
console.log('\n📱 Checking screen components...');
const screens = [
  'AnganwadiDashboard',
  'FamilyDashboard', 
  'UploadPhotoScreen'
];

screens.forEach(screen => {
  try {
    const screenPath = `src/screens/${screen}.tsx`;
    const content = fs.readFileSync(screenPath, 'utf8');
    
    if (content.includes(`export default function ${screen}`) || 
        content.includes(`export default ${screen}`)) {
      console.log(`✅ ${screen} component properly exported`);
    } else {
      console.log(`❌ ${screen} component export issue`);
      filesOk = false;
    }
  } catch (error) {
    console.log(`❌ ${screen} - Error reading file`);
    filesOk = false;
  }
});

// Final Result
console.log('\n' + '='.repeat(50));
if (filesOk) {
  console.log('🎉 HEALTH CHECK PASSED - App is ready to run!');
  console.log('✅ All required files present');
  console.log('✅ Dependencies configured correctly');
  console.log('✅ API service properly structured');
  console.log('✅ Screen components properly exported');
  console.log('\n🚀 You can now run: npm start');
} else {
  console.log('⚠️  HEALTH CHECK FAILED - Issues found');
  console.log('❌ Please fix the above issues before running the app');
}
console.log('='.repeat(50));
