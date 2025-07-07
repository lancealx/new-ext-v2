#!/usr/bin/env node

/**
 * License Administration Script
 * 
 * Simple command-line tool for managing extension licenses.
 * This script helps create and manage the config.json file for license validation.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Promisify fs functions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Default config file path
const CONFIG_FILE = path.join(__dirname, '..', 'config.json');

// Default config template
const DEFAULT_CONFIG = {
  enabled: true,
  version: "1.0.0",
  licenses: {
    domain_licenses: {},
    user_licenses: {}
  },
  default_features: ["search"],
  license_server: "https://storage.googleapis.com/toolbar_resources/",
  last_updated: new Date().toISOString()
};

// Available features
const AVAILABLE_FEATURES = [
  'search',
  'data_grid',
  'kanban_board',
  'analytics',
  'export',
  'automation'
];

class LicenseAdmin {
  constructor() {
    this.config = null;
  }

  /**
   * Load existing config or create default
   */
  async loadConfig() {
    try {
      const data = await readFile(CONFIG_FILE, 'utf8');
      this.config = JSON.parse(data);
      console.log('✓ Loaded existing config');
    } catch (error) {
      console.log('Creating new config file...');
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  /**
   * Save config to file
   */
  async saveConfig() {
    this.config.last_updated = new Date().toISOString();
    await writeFile(CONFIG_FILE, JSON.stringify(this.config, null, 2));
    console.log('✓ Config saved to', CONFIG_FILE);
  }

  /**
   * Add or update a domain license
   */
  addDomainLicense(domain, expires, features = ['search'], maxUsers = null) {
    if (!this.config.licenses.domain_licenses) {
      this.config.licenses.domain_licenses = {};
    }

    this.config.licenses.domain_licenses[domain] = {
      valid: true,
      expires: expires,
      features: features,
      ...(maxUsers && { max_users: maxUsers })
    };

    console.log(`✓ Added domain license for ${domain}`);
  }

  /**
   * Add or update a user license
   */
  addUserLicense(email, expires, features = ['search']) {
    if (!this.config.licenses.user_licenses) {
      this.config.licenses.user_licenses = {};
    }

    this.config.licenses.user_licenses[email] = {
      valid: true,
      expires: expires,
      features: features
    };

    console.log(`✓ Added user license for ${email}`);
  }

  /**
   * Disable a license
   */
  disableLicense(type, identifier) {
    if (type === 'domain' && this.config.licenses.domain_licenses[identifier]) {
      this.config.licenses.domain_licenses[identifier].valid = false;
      console.log(`✓ Disabled domain license for ${identifier}`);
    } else if (type === 'user' && this.config.licenses.user_licenses[identifier]) {
      this.config.licenses.user_licenses[identifier].valid = false;
      console.log(`✓ Disabled user license for ${identifier}`);
    } else {
      console.log(`✗ License not found: ${type} ${identifier}`);
    }
  }

  /**
   * Remove a license
   */
  removeLicense(type, identifier) {
    if (type === 'domain' && this.config.licenses.domain_licenses[identifier]) {
      delete this.config.licenses.domain_licenses[identifier];
      console.log(`✓ Removed domain license for ${identifier}`);
    } else if (type === 'user' && this.config.licenses.user_licenses[identifier]) {
      delete this.config.licenses.user_licenses[identifier];
      console.log(`✓ Removed user license for ${identifier}`);
    } else {
      console.log(`✗ License not found: ${type} ${identifier}`);
    }
  }

  /**
   * List all licenses
   */
  listLicenses() {
    console.log('\n📋 Current License Configuration:');
    console.log('Extension Enabled:', this.config.enabled);
    console.log('Version:', this.config.version);
    console.log('Default Features:', this.config.default_features.join(', '));
    console.log('Last Updated:', this.config.last_updated);

    console.log('\n🏢 Domain Licenses:');
    const domainLicenses = this.config.licenses.domain_licenses || {};
    if (Object.keys(domainLicenses).length === 0) {
      console.log('  None');
    } else {
      Object.entries(domainLicenses).forEach(([domain, license]) => {
        const status = license.valid ? '✅' : '❌';
        const expires = new Date(license.expires).toLocaleDateString();
        console.log(`  ${status} ${domain} (expires: ${expires})`);
        console.log(`     Features: ${license.features.join(', ')}`);
        if (license.max_users) console.log(`     Max Users: ${license.max_users}`);
      });
    }

    console.log('\n👤 User Licenses:');
    const userLicenses = this.config.licenses.user_licenses || {};
    if (Object.keys(userLicenses).length === 0) {
      console.log('  None');
    } else {
      Object.entries(userLicenses).forEach(([email, license]) => {
        const status = license.valid ? '✅' : '❌';
        const expires = new Date(license.expires).toLocaleDateString();
        console.log(`  ${status} ${email} (expires: ${expires})`);
        console.log(`     Features: ${license.features.join(', ')}`);
      });
    }
  }

  /**
   * Enable or disable the extension
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;
    console.log(`✓ Extension ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set default features
   */
  setDefaultFeatures(features) {
    this.config.default_features = features;
    console.log(`✓ Default features set to: ${features.join(', ')}`);
  }

  /**
   * Show help
   */
  showHelp() {
    console.log(`
License Administration Tool

Usage: node license-admin.js <command> [options]

Commands:
  list                           List all licenses
  add-domain <domain> <expires> [features]  Add domain license
  add-user <email> <expires> [features]     Add user license
  disable-domain <domain>        Disable domain license
  disable-user <email>           Disable user license
  remove-domain <domain>         Remove domain license
  remove-user <email>            Remove user license
  enable                         Enable extension
  disable                        Disable extension
  set-defaults <features>        Set default features

Examples:
  node license-admin.js add-domain "*.nanolos.com" "2025-12-31" "search,data_grid,export"
  node license-admin.js add-user "user@company.com" "2025-06-30" "search,analytics"
  node license-admin.js disable-domain "old-domain.com"
  node license-admin.js set-defaults "search,data_grid"

Available Features:
  ${AVAILABLE_FEATURES.join(', ')}

Date Format: YYYY-MM-DD
Wildcards: Use *.domain.com for subdomains
`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help') {
    new LicenseAdmin().showHelp();
    return;
  }

  const admin = new LicenseAdmin();
  await admin.loadConfig();

  switch (command) {
    case 'list':
      admin.listLicenses();
      break;

    case 'add-domain':
      if (args.length < 3) {
        console.log('Usage: add-domain <domain> <expires> [features]');
        return;
      }
      const domain = args[1];
      const domainExpires = args[2];
      const domainFeatures = args[3] ? args[3].split(',') : ['search'];
      admin.addDomainLicense(domain, domainExpires, domainFeatures);
      await admin.saveConfig();
      break;

    case 'add-user':
      if (args.length < 3) {
        console.log('Usage: add-user <email> <expires> [features]');
        return;
      }
      const email = args[1];
      const userExpires = args[2];
      const userFeatures = args[3] ? args[3].split(',') : ['search'];
      admin.addUserLicense(email, userExpires, userFeatures);
      await admin.saveConfig();
      break;

    case 'disable-domain':
      if (args.length < 2) {
        console.log('Usage: disable-domain <domain>');
        return;
      }
      admin.disableLicense('domain', args[1]);
      await admin.saveConfig();
      break;

    case 'disable-user':
      if (args.length < 2) {
        console.log('Usage: disable-user <email>');
        return;
      }
      admin.disableLicense('user', args[1]);
      await admin.saveConfig();
      break;

    case 'remove-domain':
      if (args.length < 2) {
        console.log('Usage: remove-domain <domain>');
        return;
      }
      admin.removeLicense('domain', args[1]);
      await admin.saveConfig();
      break;

    case 'remove-user':
      if (args.length < 2) {
        console.log('Usage: remove-user <email>');
        return;
      }
      admin.removeLicense('user', args[1]);
      await admin.saveConfig();
      break;

    case 'enable':
      admin.setEnabled(true);
      await admin.saveConfig();
      break;

    case 'disable':
      admin.setEnabled(false);
      await admin.saveConfig();
      break;

    case 'set-defaults':
      if (args.length < 2) {
        console.log('Usage: set-defaults <features>');
        return;
      }
      const features = args[1].split(',');
      admin.setDefaultFeatures(features);
      await admin.saveConfig();
      break;

    default:
      console.log('Unknown command:', command);
      admin.showHelp();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = LicenseAdmin; 