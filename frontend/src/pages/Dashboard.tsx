// import React from 'react';
import Layout from '../components/Layout';
import { Users, Upload, Wrench, BarChart3 } from 'lucide-react';

const stats = [
  { name: 'Connected Accounts', value: '3', icon: Users },
  { name: 'Posts This Month', value: '24', icon: Upload },
  { name: 'Tools Used', value: '8', icon: Wrench },
  { name: 'Total Reach', value: '12.5K', icon: BarChart3 },
];

export default function Dashboard() {
  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-700">
              Welcome to your social media management dashboard
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8">
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.name}
                  className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
                >
                  <dt>
                    <div className="absolute bg-primary-500 rounded-md p-3">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </p>
                  </dt>
                  <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                    <p className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </p>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="text-sm text-gray-500">
                <p className="mb-2">• Connected Instagram account @yourhandle</p>
                <p className="mb-2">• Generated 5 captions using AI tool</p>
                <p className="mb-2">• Scheduled 3 posts for this week</p>
                <p className="mb-2">• Analytics report generated</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}