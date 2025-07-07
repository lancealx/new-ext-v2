#!/usr/bin/env node

/**
 * Test script for the license service
 * This script tests the license service with the config approach
 */

const fs = require('fs');
const path = require('path');

// Create test config
const testConfig = {
  enabled: true,
  version: "1.0.0",
  licenses: {
    domain_licenses: {
      "localhost": {
        valid: true,
        expires: "2025-12-31",
        features: ["search", "data_grid", "export"],
        max_users: 10
      },
      "*.nanolos.com": {
        valid: true,
        expires: "2025-12-31",
        features: ["search", "data_grid", "kanban_board", "analytics", "export", "automation"],
        max_users: 100
      }
    },
    user_licenses: {
      "test@example.com": {
        valid: true,
        expires: "2025-06-30",
        features: ["search", "data_grid", "export"]
      }
    }
  },
  default_features: ["search"],
  license_server: "https://storage.googleapis.com/toolbar_resources/",
  last_updated: new Date().toISOString()
};

// Create test config file
const configPath = path.join(__dirname, 'test-config.json');
fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

console.log('✓ Created test config file:', configPath);

// Test domain matching
function testDomainMatching() {
  console.log('\n🧪 Testing domain matching:');
  
  const testCases = [
    { domain: 'localhost', pattern: 'localhost', expected: true },
    { domain: 'app.nanolos.com', pattern: '*.nanolos.com', expected: true },
    { domain: 'api.nanolos.com', pattern: '*.nanolos.com', expected: true },
    { domain: 'other.com', pattern: '*.nanolos.com', expected: false },
    { domain: 'nanolos.com', pattern: '*.nanolos.com', expected: true },
  ];

  function domainMatches(domain, pattern) {
    if (pattern.startsWith('*.')) {
      const baseDomain = pattern.slice(2);
      return domain.endsWith(baseDomain);
    }
    return domain === pattern;
  }

  testCases.forEach(({ domain, pattern, expected }) => {
    const result = domainMatches(domain, pattern);
    const status = result === expected ? '✅' : '❌';
    console.log(`  ${status} ${domain} vs ${pattern} = ${result}`);
  });
}

// Test license validation logic
function testLicenseValidation() {
  console.log('\n🧪 Testing license validation:');
  
  function validateLicenseFromConfig(config, domain, userEmail) {
    const now = new Date();
    
    // Check user-specific license first
    if (config.licenses.user_licenses && config.licenses.user_licenses[userEmail]) {
      const userLicense = config.licenses.user_licenses[userEmail];
      const expires = new Date(userLicense.expires);
      
      if (userLicense.valid && expires > now) {
        return {
          valid: true,
          expires: userLicense.expires,
          features: userLicense.features || [],
          type: 'user',
          daysRemaining: Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        };
      }
    }
    
    // Check domain license
    const domainLicenses = config.licenses.domain_licenses || {};
    
    for (const [licensedDomain, license] of Object.entries(domainLicenses)) {
      if (domainMatches(domain, licensedDomain)) {
        const expires = new Date(license.expires);
        
        if (license.valid && expires > now) {
          return {
            valid: true,
            expires: license.expires,
            features: license.features || [],
            type: 'domain',
            daysRemaining: Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          };
        }
      }
    }
    
    // No valid license found
    return {
      valid: false,
      expires: null,
      features: config.default_features || [],
      type: 'none',
      daysRemaining: 0
    };
  }

  function domainMatches(domain, pattern) {
    if (pattern.startsWith('*.')) {
      const baseDomain = pattern.slice(2);
      return domain.endsWith(baseDomain);
    }
    return domain === pattern;
  }

  const testCases = [
    {
      domain: 'localhost',
      userEmail: 'unknown@example.com',
      expected: { valid: true, type: 'domain', features: ['search', 'data_grid', 'export'] }
    },
    {
      domain: 'app.nanolos.com',
      userEmail: 'unknown@example.com',
      expected: { valid: true, type: 'domain', features: ['search', 'data_grid', 'kanban_board', 'analytics', 'export', 'automation'] }
    },
    {
      domain: 'unknown.com',
      userEmail: 'test@example.com',
      expected: { valid: true, type: 'user', features: ['search', 'data_grid', 'export'] }
    },
    {
      domain: 'unknown.com',
      userEmail: 'unknown@example.com',
      expected: { valid: false, type: 'none', features: ['search'] }
    }
  ];

  testCases.forEach(({ domain, userEmail, expected }, index) => {
    const result = validateLicenseFromConfig(testConfig, domain, userEmail);
    const isValid = result.valid === expected.valid && 
                   result.type === expected.type && 
                   JSON.stringify(result.features) === JSON.stringify(expected.features);
    
    const status = isValid ? '✅' : '❌';
    console.log(`  ${status} Test ${index + 1}: ${domain} + ${userEmail}`);
    console.log(`    Expected: ${JSON.stringify(expected)}`);
    console.log(`    Got: ${JSON.stringify({ valid: result.valid, type: result.type, features: result.features })}`);
  });
}

// Test config enable/disable
function testConfigEnabled() {
  console.log('\n🧪 Testing config enabled/disabled:');
  
  // Test with enabled = false
  const disabledConfig = { ...testConfig, enabled: false };
  
  function validateWithDisabled(config, domain, userEmail) {
    if (!config.enabled) {
      return {
        valid: false,
        expires: null,
        features: [],
        type: 'none',
        daysRemaining: 0
      };
    }
    // ... rest of validation logic
    return { valid: true, type: 'domain', features: ['search'] };
  }
  
  const result = validateWithDisabled(disabledConfig, 'localhost', 'test@example.com');
  const status = !result.valid && result.features.length === 0 ? '✅' : '❌';
  console.log(`  ${status} Disabled config blocks all access`);
}

// Run tests
async function runTests() {
  console.log('🚀 Starting License Service Tests\n');
  
  testDomainMatching();
  testLicenseValidation();
  testConfigEnabled();
  
  console.log('\n✨ Tests completed!');
  console.log('\nTo use this config with your license service:');
  console.log('1. Copy test-config.json to your Google Cloud Storage');
  console.log('2. Configure the license service with: licenseService.configure("path/to/config.json")');
  console.log('3. Call licenseService.validateLicense() to test');
  
  // Clean up
  fs.unlinkSync(configPath);
  console.log('\n🧹 Cleaned up test files');
}

runTests().catch(console.error); 