// Google Cloud Function for License Validation
// Deploy this to Google Cloud Functions

const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');

const storage = new Storage();
const bucketName = 'your-license-bucket';
const fileName = 'licenses.json';

// HTTP function for license validation
functions.http('validateLicense', async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { domain, userEmail, extensionId } = req.body;

    // Download license data from Cloud Storage
    const file = storage.bucket(bucketName).file(fileName);
    const [contents] = await file.download();
    const licenseData = JSON.parse(contents.toString());

    // Validate license
    const validation = validateLicense(licenseData, domain, userEmail);
    
    // Log access attempt
    console.log(`License check: ${domain} - ${userEmail} - Valid: ${validation.valid}`);
    
    res.json(validation);
  } catch (error) {
    console.error('License validation error:', error);
    res.status(500).json({ 
      valid: false, 
      error: 'License validation failed',
      features: []
    });
  }
});

function validateLicense(licenseData, domain, userEmail) {
  const now = new Date();
  
  // Check user-specific license first
  if (licenseData.user_licenses && licenseData.user_licenses[userEmail]) {
    const userLicense = licenseData.user_licenses[userEmail];
    const expires = new Date(userLicense.expires);
    
    if (userLicense.valid && expires > now) {
      return {
        valid: true,
        expires: userLicense.expires,
        features: userLicense.features || [],
        type: 'user',
        daysRemaining: Math.ceil((expires - now) / (1000 * 60 * 60 * 24))
      };
    }
  }
  
  // Check domain license
  const domainLicenses = licenseData.domain_licenses || {};
  
  for (const [licensedDomain, license] of Object.entries(domainLicenses)) {
    if (domainMatches(domain, licensedDomain)) {
      const expires = new Date(license.expires);
      
      if (license.valid && expires > now) {
        return {
          valid: true,
          expires: license.expires,
          features: license.features || [],
          type: 'domain',
          daysRemaining: Math.ceil((expires - now) / (1000 * 60 * 60 * 24))
        };
      }
    }
  }
  
  // No valid license found
  return {
    valid: false,
    expires: null,
    features: licenseData.default_features || [],
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

// Admin function to update licenses
functions.http('updateLicense', async (req, res) => {
  // Add authentication check here
  const { adminKey } = req.headers;
  if (adminKey !== process.env.ADMIN_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const licenseData = req.body;
    
    // Upload to Cloud Storage
    const file = storage.bucket(bucketName).file(fileName);
    await file.save(JSON.stringify(licenseData, null, 2));
    
    res.json({ success: true, message: 'License updated' });
  } catch (error) {
    console.error('License update error:', error);
    res.status(500).json({ error: 'Failed to update license' });
  }
}); 