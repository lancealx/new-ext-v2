import React, { useState, useEffect } from 'react';
import './App.css';
import AdminDashboard from './pages/AdminDashboard';
import { DataGrid } from './components/ui/data-grid';
import { licenseService } from './services/licenseService';
import { userService } from './services/userService';
import { analyticsService } from './services/analyticsService';
import { tokenService } from './services/tokenService';

interface AppState {
  currentView: 'main' | 'admin' | 'search' | 'loans';
  user: any;
  license: any;
  loading: boolean;
  error: string | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    currentView: 'main',
    user: null,
    license: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize services
      await analyticsService.initialize();
      await userService.initialize(tokenService);
      
      // Get user and license info
      const user = await userService.getCurrentUser();
      const license = await licenseService.getLicenseInfo();

      setState(prev => ({
        ...prev,
        user,
        license,
        loading: false
      }));

      // Log app initialization
      analyticsService.logActivity('app_initialized', {
        user: user?.email,
        license: license?.valid
      });

      // Check URL parameters for admin access
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('admin') === 'true') {
        setState(prev => ({ ...prev, currentView: 'admin' }));
      }

    } catch (error) {
      console.error('Failed to initialize app:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize app',
        loading: false
      }));
      analyticsService.logError(error as Error, { context: 'app_initialization' });
    }
  };

  const handleViewChange = (view: AppState['currentView']) => {
    setState(prev => ({ ...prev, currentView: view }));
    analyticsService.logActivity('view_change', { view });
  };

  const handleSearch = async (query: string) => {
    try {
      analyticsService.logSearchActivity(query, 0, { source: 'main_app' });
      
      // Simulate search functionality
      console.log('Searching for:', query);
      
      // Here you would implement actual search logic
      // For now, just show the search view
      setState(prev => ({ ...prev, currentView: 'search' }));
      
    } catch (error) {
      console.error('Search failed:', error);
      analyticsService.logError(error as Error, { context: 'search', query });
    }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Pipeline Pro...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{state.error}</p>
          <button
            onClick={initializeApp}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!state.license?.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-600 text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">License Required</h1>
          <p className="text-gray-600">
            A valid license is required to use Pipeline Pro.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Contact your administrator for assistance.</p>
          </div>
        </div>
      </div>
    );
  }

  // Render admin dashboard if in admin mode
  if (state.currentView === 'admin') {
    return <AdminDashboard />;
  }

  // Main application UI
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Pipeline Pro</h1>
              <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                v{chrome.runtime.getManifest().version}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {state.user?.displayName || state.user?.email}
              </div>
              {(state.user?.permissions?.includes('admin_access') || state.user?.role === 'admin') && (
                <button
                  onClick={() => handleViewChange('admin')}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'main', label: 'Dashboard', icon: '🏠' },
              { id: 'search', label: 'Search', icon: '🔍' },
              { id: 'loans', label: 'Loans', icon: '💰' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id as AppState['currentView'])}
                className={`${
                  state.currentView === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {state.currentView === 'main' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Search</h2>
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="Search loans, borrowers, or loan officers..."
                  className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch((e.target as HTMLInputElement).value);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input') as HTMLInputElement;
                    if (input) handleSearch(input.value);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">License Status</h3>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-sm text-gray-600">Active</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Expires: {state.license?.expires ? new Date(state.license.expires).toLocaleDateString() : 'Never'}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Available Features</h3>
                <div className="space-y-1">
                  {state.license?.features?.slice(0, 3).map((feature: string) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span className="text-sm text-gray-600">{feature.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">User Info</h3>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Role:</span> {state.user?.role || 'User'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Permissions:</span> {state.user?.permissions?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Organization:</span> {state.user?.organizationId || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.currentView === 'search' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Search Results</h2>
            <p className="text-gray-600">Search functionality will be implemented here.</p>
          </div>
        )}

        {state.currentView === 'loans' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Loan Management</h2>
                         <DataGrid 
               rowData={[]}
               columnDefs={[]}
               onGridReady={(params) => {
                 console.log('Grid ready:', params);
                 // Grid ready callback
               }}
             />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
