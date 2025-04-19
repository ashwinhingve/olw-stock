'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/storeContext';
import Layout from '@/components/ui/Layout';
import toast from 'react-hot-toast';
import { 
  Cog6ToothIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  ShoppingBagIcon 
} from '@heroicons/react/24/outline';

interface SettingsState {
  generalSettings: {
    language: string;
    timezone: string;
    darkMode: boolean;
  };
  notificationSettings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    marketingEmails: boolean;
  };
  storeSettings: {
    currency: string;
    inventoryAlerts: boolean;
    lowStockThreshold: number;
  };
  securitySettings: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    loginNotifications: boolean;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading, setLoading } = useStore();
  
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState<SettingsState>({
    generalSettings: {
      language: 'en',
      timezone: 'UTC',
      darkMode: false,
    },
    notificationSettings: {
      emailNotifications: true,
      pushNotifications: false,
      marketingEmails: false,
    },
    storeSettings: {
      currency: 'USD',
      inventoryAlerts: true,
      lowStockThreshold: 5,
    },
    securitySettings: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      loginNotifications: true,
    }
  });
  
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      // Normally would fetch from API, using mock data for now
      // const response = await fetch('/api/settings');
      // const data = await response.json();
      // setSettings(data);
      
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data already set in useState
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [setLoading]);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      fetchSettings();
    }
  }, [isLoggedIn, router, fetchSettings]);
  
  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setSettings(prev => ({
      ...prev,
      generalSettings: {
        ...prev.generalSettings,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };
  
  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setSettings(prev => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [name]: checked
      }
    }));
  };
  
  const handleStoreChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setSettings(prev => ({
      ...prev,
      storeSettings: {
        ...prev.storeSettings,
        [name]: type === 'checkbox' 
          ? checked 
          : name === 'lowStockThreshold' 
            ? parseInt(value, 10) 
            : value
      }
    }));
  };
  
  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setSettings(prev => ({
      ...prev,
      securitySettings: {
        ...prev.securitySettings,
        [name]: type === 'checkbox' 
          ? checked 
          : name === 'sessionTimeout' 
            ? parseInt(value, 10) 
            : value
      }
    }));
  };
  
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      // Normally would POST to API
      // await fetch('/api/settings', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(settings)
      // });
      
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!isLoggedIn) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b">
            <h2 className="text-lg font-medium text-gray-900">Settings</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your account settings and preferences
            </p>
          </div>
          
          <div className="flex">
            {/* Sidebar */}
            <div className="w-1/4 border-r">
              <nav className="py-4">
                <button
                  className={`flex items-center px-4 py-3 w-full text-left ${
                    activeTab === 'general' 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('general')}
                >
                  <Cog6ToothIcon className="w-5 h-5 mr-2" />
                  <span>General</span>
                </button>
                
                <button
                  className={`flex items-center px-4 py-3 w-full text-left ${
                    activeTab === 'notifications' 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <BellIcon className="w-5 h-5 mr-2" />
                  <span>Notifications</span>
                </button>
                
                <button
                  className={`flex items-center px-4 py-3 w-full text-left ${
                    activeTab === 'store' 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('store')}
                >
                  <ShoppingBagIcon className="w-5 h-5 mr-2" />
                  <span>Store</span>
                </button>
                
                <button
                  className={`flex items-center px-4 py-3 w-full text-left ${
                    activeTab === 'security' 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('security')}
                >
                  <ShieldCheckIcon className="w-5 h-5 mr-2" />
                  <span>Security</span>
                </button>
              </nav>
            </div>
            
            {/* Main content */}
            <div className="w-3/4 p-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  {/* General Settings */}
                  {activeTab === 'general' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                            Language
                          </label>
                          <select
                            id="language"
                            name="language"
                            value={settings.generalSettings.language}
                            onChange={handleGeneralChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                            Timezone
                          </label>
                          <select
                            id="timezone"
                            name="timezone"
                            value={settings.generalSettings.timezone}
                            onChange={handleGeneralChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          >
                            <option value="UTC">UTC</option>
                            <option value="EST">Eastern Standard Time (EST)</option>
                            <option value="CST">Central Standard Time (CST)</option>
                            <option value="PST">Pacific Standard Time (PST)</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            id="darkMode"
                            name="darkMode"
                            type="checkbox"
                            checked={settings.generalSettings.darkMode}
                            onChange={handleGeneralChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="darkMode" className="ml-2 block text-sm text-gray-900">
                            Dark Mode
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Notification Settings */}
                  {activeTab === 'notifications' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
                      
                      <div className="space-y-6">
                        <div className="flex items-center">
                          <input
                            id="emailNotifications"
                            name="emailNotifications"
                            type="checkbox"
                            checked={settings.notificationSettings.emailNotifications}
                            onChange={handleNotificationChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                            Email Notifications
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            id="pushNotifications"
                            name="pushNotifications"
                            type="checkbox"
                            checked={settings.notificationSettings.pushNotifications}
                            onChange={handleNotificationChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="pushNotifications" className="ml-2 block text-sm text-gray-900">
                            Push Notifications
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            id="marketingEmails"
                            name="marketingEmails"
                            type="checkbox"
                            checked={settings.notificationSettings.marketingEmails}
                            onChange={handleNotificationChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="marketingEmails" className="ml-2 block text-sm text-gray-900">
                            Marketing Emails
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Store Settings */}
                  {activeTab === 'store' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Store Settings</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                            Currency
                          </label>
                          <select
                            id="currency"
                            name="currency"
                            value={settings.storeSettings.currency}
                            onChange={handleStoreChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          >
                            <option value="USD">US Dollar (USD)</option>
                            <option value="EUR">Euro (EUR)</option>
                            <option value="GBP">British Pound (GBP)</option>
                            <option value="JPY">Japanese Yen (JPY)</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            id="inventoryAlerts"
                            name="inventoryAlerts"
                            type="checkbox"
                            checked={settings.storeSettings.inventoryAlerts}
                            onChange={handleStoreChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="inventoryAlerts" className="ml-2 block text-sm text-gray-900">
                            Inventory Alerts
                          </label>
                        </div>
                        
                        <div>
                          <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700">
                            Low Stock Threshold
                          </label>
                          <input
                            type="number"
                            id="lowStockThreshold"
                            name="lowStockThreshold"
                            min="1"
                            max="100"
                            value={settings.storeSettings.lowStockThreshold}
                            onChange={handleStoreChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Security Settings */}
                  {activeTab === 'security' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
                      
                      <div className="space-y-6">
                        <div className="flex items-center">
                          <input
                            id="twoFactorAuth"
                            name="twoFactorAuth"
                            type="checkbox"
                            checked={settings.securitySettings.twoFactorAuth}
                            onChange={handleSecurityChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="twoFactorAuth" className="ml-2 block text-sm text-gray-900">
                            Two-Factor Authentication
                          </label>
                        </div>
                        
                        <div>
                          <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700">
                            Session Timeout (minutes)
                          </label>
                          <input
                            type="number"
                            id="sessionTimeout"
                            name="sessionTimeout"
                            min="5"
                            max="120"
                            value={settings.securitySettings.sessionTimeout}
                            onChange={handleSecurityChange}
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            id="loginNotifications"
                            name="loginNotifications"
                            type="checkbox"
                            checked={settings.securitySettings.loginNotifications}
                            onChange={handleSecurityChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="loginNotifications" className="ml-2 block text-sm text-gray-900">
                            Login Notifications
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-8 border-t pt-5">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={saveSettings}
                        disabled={isSaving}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 