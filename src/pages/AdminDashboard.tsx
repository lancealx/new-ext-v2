import React, { useState, useEffect } from 'react';
import { licenseService } from '../services/licenseService';
import { userService } from '../services/userService';

interface License {
  type: 'domain' | 'user';
  identifier: string;
  valid: boolean;
  expires: string;
  features: string[];
  maxUsers?: number;
}

interface UserLog {
  timestamp: string;
  userId: string;
  email: string;
  action: string;
  details: any;
  domain: string;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'licenses' | 'logs' | 'config'>('licenses');
  const [licenses, setLicenses] = useState<License[]>([]);
  const [userLogs, setUserLogs] = useState<UserLog[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New license form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLicense, setNewLicense] = useState({
    type: 'domain' as 'domain' | 'user',
    identifier: '',
    expires: '',
    features: [] as string[],
    maxUsers: ''
  });

  const availableFeatures = [
    'search',
    'data_grid', 
    'kanban_board',
    'analytics',
    'export',
    'automation'
  ];

  useEffect(() => {
    initializeAdmin();
  }, []);

  const initializeAdmin = async () => {
    try {
      setLoading(true);
      
      // Check if user has admin permissions
      const user = await userService.getCurrentUser();
      // Check for admin role or email domain, or specific admin permission ID
      const hasAdminAccess = user?.role === 'admin' ||
                           user?.email?.includes('@nanolos.com') ||
                           user?.permissions.includes(240); // Admin permission ID
      
      if (!hasAdminAccess) {
        setError('Access denied. Admin permissions required.');
        return;
      }

      setIsAdmin(true);
      await loadLicenses();
      await loadUserLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadLicenses = async () => {
    try {
      // Get current license config from storage
      const result = await chrome.storage.local.get('license_config');
      const config = result.license_config;
      
      if (!config?.licenses) {
        setLicenses([]);
        return;
      }

      const licenseList: License[] = [];

      // Add domain licenses
      Object.entries(config.licenses.domain_licenses || {}).forEach(([domain, license]: [string, any]) => {
        licenseList.push({
          type: 'domain',
          identifier: domain,
          valid: license.valid,
          expires: license.expires,
          features: license.features || [],
          maxUsers: license.max_users
        });
      });

      // Add user licenses
      Object.entries(config.licenses.user_licenses || {}).forEach(([email, license]: [string, any]) => {
        licenseList.push({
          type: 'user',
          identifier: email,
          valid: license.valid,
          expires: license.expires,
          features: license.features || []
        });
      });

      setLicenses(licenseList);
    } catch (err) {
      console.error('Failed to load licenses:', err);
    }
  };

  const loadUserLogs = async () => {
    try {
      // Get user activity logs from storage
      const result = await chrome.storage.local.get('user_activity_logs');
      const logs = result.user_activity_logs || [];
      
      // Sort by timestamp (newest first)
      const sortedLogs = logs.sort((a: UserLog, b: UserLog) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setUserLogs(sortedLogs.slice(0, 100)); // Show last 100 logs
    } catch (err) {
      console.error('Failed to load user logs:', err);
    }
  };

  const addLicense = async () => {
    try {
      if (!newLicense.identifier || !newLicense.expires || newLicense.features.length === 0) {
        alert('Please fill in all required fields');
        return;
      }

      // Get current config
      const result = await chrome.storage.local.get('license_config');
      const config = result.license_config || {
        enabled: true,
        version: '1.0.0',
        licenses: { domain_licenses: {}, user_licenses: {} },
        default_features: ['search'],
        license_server: 'https://storage.googleapis.com/toolbar_resources/',
        last_updated: new Date().toISOString()
      };

      // Add new license
      const licenseData = {
        valid: true,
        expires: newLicense.expires,
        features: newLicense.features,
        ...(newLicense.type === 'domain' && newLicense.maxUsers && { max_users: parseInt(newLicense.maxUsers) })
      };

      if (newLicense.type === 'domain') {
        config.licenses.domain_licenses[newLicense.identifier] = licenseData;
      } else {
        config.licenses.user_licenses[newLicense.identifier] = licenseData;
      }

      config.last_updated = new Date().toISOString();

      // Save to storage
      await chrome.storage.local.set({ license_config: config });

      // Reset form and reload
      setNewLicense({
        type: 'domain',
        identifier: '',
        expires: '',
        features: [],
        maxUsers: ''
      });
      setShowAddForm(false);
      await loadLicenses();
      
      alert('License added successfully!');
    } catch (err) {
      alert('Failed to add license: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const toggleLicense = async (license: License) => {
    try {
      const result = await chrome.storage.local.get('license_config');
      const config = result.license_config;
      
      if (!config) return;

      if (license.type === 'domain') {
        config.licenses.domain_licenses[license.identifier].valid = !license.valid;
      } else {
        config.licenses.user_licenses[license.identifier].valid = !license.valid;
      }

      config.last_updated = new Date().toISOString();
      await chrome.storage.local.set({ license_config: config });
      await loadLicenses();
    } catch (err) {
      alert('Failed to update license: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const deleteLicense = async (license: License) => {
    if (!confirm(`Are you sure you want to delete the license for ${license.identifier}?`)) {
      return;
    }

    try {
      const result = await chrome.storage.local.get('license_config');
      const config = result.license_config;
      
      if (!config) return;

      if (license.type === 'domain') {
        delete config.licenses.domain_licenses[license.identifier];
      } else {
        delete config.licenses.user_licenses[license.identifier];
      }

      config.last_updated = new Date().toISOString();
      await chrome.storage.local.set({ license_config: config });
      await loadLicenses();
    } catch (err) {
      alert('Failed to delete license: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const exportConfig = async () => {
    try {
      const result = await chrome.storage.local.get('license_config');
      const config = result.license_config;
      
      const dataStr = JSON.stringify(config, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `license-config-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export config: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all user activity logs?')) {
      return;
    }

    try {
      await chrome.storage.local.set({ user_activity_logs: [] });
      setUserLogs([]);
      alert('User logs cleared successfully!');
    } catch (err) {
      alert('Failed to clear logs: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Pipeline Pro
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={exportConfig}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Export Config
              </button>
              <button
                onClick={() => window.close()}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'licenses', label: 'License Management', icon: '🔑' },
              { id: 'logs', label: 'User Activity Logs', icon: '📊' },
              { id: 'config', label: 'Configuration', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'licenses' && (
          <div className="space-y-6">
            {/* Add License Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">License Management</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add License
              </button>
            </div>

            {/* Add License Form */}
            {showAddForm && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New License</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Type
                    </label>
                    <select
                      value={newLicense.type}
                      onChange={(e) => setNewLicense({ ...newLicense, type: e.target.value as 'domain' | 'user' })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="domain">Domain License</option>
                      <option value="user">User License</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newLicense.type === 'domain' ? 'Domain' : 'Email'}
                    </label>
                    <input
                      type="text"
                      value={newLicense.identifier}
                      onChange={(e) => setNewLicense({ ...newLicense, identifier: e.target.value })}
                      placeholder={newLicense.type === 'domain' ? 'example.com or *.example.com' : 'user@example.com'}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      value={newLicense.expires}
                      onChange={(e) => setNewLicense({ ...newLicense, expires: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {newLicense.type === 'domain' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Users (optional)
                      </label>
                      <input
                        type="number"
                        value={newLicense.maxUsers}
                        onChange={(e) => setNewLicense({ ...newLicense, maxUsers: e.target.value })}
                        placeholder="e.g., 50"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Features
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableFeatures.map((feature) => (
                      <label key={feature} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newLicense.features.includes(feature)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewLicense({
                                ...newLicense,
                                features: [...newLicense.features, feature]
                              });
                            } else {
                              setNewLicense({
                                ...newLicense,
                                features: newLicense.features.filter(f => f !== feature)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{feature.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={addLicense}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Add License
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Licenses List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Identifier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Features
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {licenses.map((license, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          license.type === 'domain' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {license.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {license.identifier}
                        {license.maxUsers && (
                          <div className="text-xs text-gray-500">Max users: {license.maxUsers}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          license.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {license.valid ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(license.expires).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1">
                          {license.features.map((feature) => (
                            <span key={feature} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {feature.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleLicense(license)}
                            className={`px-3 py-1 rounded text-xs ${
                              license.valid 
                                ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {license.valid ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => deleteLicense(license)}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {licenses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No licenses found. Click "Add License" to create your first license.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">User Activity Logs</h2>
              <button
                onClick={clearLogs}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Clear Logs
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userLogs.map((log, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{log.email}</div>
                          <div className="text-xs text-gray-500">ID: {log.userId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.domain}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-w-xs">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {userLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No user activity logs found.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Configuration</h2>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">License Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Licenses:</span>
                      <span className="font-medium">{licenses.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Licenses:</span>
                      <span className="font-medium">{licenses.filter(l => l.valid).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Domain Licenses:</span>
                      <span className="font-medium">{licenses.filter(l => l.type === 'domain').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>User Licenses:</span>
                      <span className="font-medium">{licenses.filter(l => l.type === 'user').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total User Logs:</span>
                      <span className="font-medium">{userLogs.length}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Actions</h4>
                  <div className="space-y-2">
                    <button
                      onClick={exportConfig}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Export Configuration
                    </button>
                    <button
                      onClick={() => loadLicenses()}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      Refresh Licenses
                    </button>
                    <button
                      onClick={() => loadUserLogs()}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                    >
                      Refresh Logs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 