import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getAccounts } from '../lib/api';
import { Plus, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react';

interface Account {
  id: string;
  platform: string;
  username: string;
  isConnected: boolean;
  followers?: number;
}

const platformIcons = {
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
};

const platformColors = {
  instagram: 'text-pink-600',
  twitter: 'text-blue-400',
  facebook: 'text-blue-600',
  linkedin: 'text-blue-700',
};

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await getAccounts();
      setAccounts(data as Account[] || []);
    } catch (err) {
      setError('Failed to load accounts');
      // For now, show mock data
      setAccounts([
        {
          id: '1',
          platform: 'instagram',
          username: '@yourhandle',
          isConnected: true,
          followers: 1250,
        },
        {
          id: '2',
          platform: 'twitter',
          username: '@yourtwitterhandle',
          isConnected: true,
          followers: 890,
        },
        {
          id: '3',
          platform: 'facebook',
          username: 'Your Page',
          isConnected: false,
          followers: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (platform: string) => {
    console.log(`Connecting to ${platform}`);
    // TODO: Implement OAuth flow
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Social Media Accounts</h1>
            <p className="mt-2 text-sm text-gray-700">
              Connect and manage your social media accounts
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Account
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-700">{error} (showing demo data)</p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const Icon = platformIcons[account.platform as keyof typeof platformIcons] || Instagram;
            const colorClass = platformColors[account.platform as keyof typeof platformColors] || 'text-gray-600';

            return (
              <div key={account.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Icon className={`h-8 w-8 ${colorClass}`} />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {account.platform}
                        </p>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          account.isConnected
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {account.isConnected ? 'Connected' : 'Not Connected'}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">{account.username}</p>
                      {account.isConnected && account.followers !== undefined && (
                        <p className="text-sm text-gray-500">
                          {account.followers.toLocaleString()} followers
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    {account.isConnected ? (
                      <div className="flex space-x-2">
                        <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200">
                          Disconnect
                        </button>
                        <button className="flex-1 bg-primary-600 text-white px-3 py-2 rounded text-sm hover:bg-primary-700">
                          Manage
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConnect(account.platform)}
                        className="w-full bg-primary-600 text-white px-3 py-2 rounded text-sm hover:bg-primary-700"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add new platform card */}
        <div className="mt-6">
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Plus className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-900">
              Connect a new platform
            </span>
            <span className="mt-1 block text-sm text-gray-500">
              Instagram, Twitter, Facebook, LinkedIn and more
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
}