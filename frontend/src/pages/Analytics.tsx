// import React from 'react';
import Layout from '../components/Layout';
import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const metrics = [
  { name: 'Total Reach', value: '12.5K', change: '+12%', icon: Eye },
  { name: 'Engagement Rate', value: '4.8%', change: '+2.3%', icon: TrendingUp },
  { name: 'New Followers', value: '284', change: '+18%', icon: Users },
  { name: 'Posts Published', value: '24', change: '+8%', icon: BarChart3 },
];

const platformData = [
  { platform: 'Instagram', followers: '8.2K', engagement: '5.2%', posts: 12 },
  { platform: 'Twitter', followers: '2.1K', engagement: '3.8%', posts: 8 },
  { platform: 'Facebook', followers: '1.8K', engagement: '4.1%', posts: 4 },
];

const engagementData = [
  { day: 'Mon', engagement: 4.2, reach: 1200 },
  { day: 'Tue', engagement: 3.8, reach: 1100 },
  { day: 'Wed', engagement: 5.1, reach: 1400 },
  { day: 'Thu', engagement: 4.6, reach: 1300 },
  { day: 'Fri', engagement: 6.2, reach: 1800 },
  { day: 'Sat', engagement: 5.8, reach: 1600 },
  { day: 'Sun', engagement: 4.9, reach: 1350 },
];

const platformEngagementData = [
  { platform: 'Instagram', engagement: 5.2, followers: 8200 },
  { platform: 'Twitter', engagement: 3.8, followers: 2100 },
  { platform: 'Facebook', engagement: 4.1, followers: 1800 },
];

export default function Analytics() {
  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
            <p className="mt-2 text-sm text-gray-700">
              Track your social media performance and growth
            </p>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="mt-8">
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.name}
                  className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
                >
                  <dt>
                    <div className="absolute bg-primary-500 rounded-md p-3">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                      {metric.name}
                    </p>
                  </dt>
                  <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                    <p className="text-2xl font-semibold text-gray-900">
                      {metric.value}
                    </p>
                    <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      {metric.change}
                    </p>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>

        {/* Platform Performance */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Platform Performance
            </h3>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Followers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posts
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {platformData.map((data) => (
                    <tr key={data.platform}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {data.platform}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.followers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.engagement}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.posts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Engagement Trends Chart */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Weekly Engagement Trends
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="engagement"
                    stroke="#2563eb"
                    strokeWidth={2}
                    name="Engagement Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Platform Comparison Chart */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Platform Engagement Comparison
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformEngagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="engagement" fill="#3b82f6" name="Engagement Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}