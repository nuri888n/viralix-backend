import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Users, Upload, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { getDashboardStats, type DashboardStats } from '../lib/api';
import { formatRelativeTime } from '../lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading dashboard...</span>
        </div>
      </Layout>
    );
  }

  if (error && !stats) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-red-600">
          <AlertCircle className="w-8 h-8 mr-2" />
          <span>{error}</span>
        </div>
      </Layout>
    );
  }

  const statItems = stats ? [
    { name: 'Total Accounts', value: stats.totalAccounts.toString(), icon: Users, color: 'bg-blue-500' },
    { name: 'Active Accounts', value: stats.activeAccounts.toString(), icon: Users, color: 'bg-green-500' },
    { name: 'Posts Today', value: stats.postsToday.toString(), icon: Upload, color: 'bg-purple-500' },
    { name: 'Posts This Week', value: stats.postsThisWeek.toString(), icon: Calendar, color: 'bg-orange-500' },
  ] : [];

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
            {statItems.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.name}
                  className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <dt>
                    <div className={`absolute ${stat.color} rounded-md p-3`}>
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

        {/* Error Rate Alert */}
        {stats && stats.errorRate > 5 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  High Error Rate Detected
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Error rate is {stats.errorRate}%. Consider checking your account connections.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Next Scheduled Posts */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Next Scheduled Posts
              </h3>
              {stats && stats.nextPosts.length > 0 ? (
                <div className="space-y-3">
                  {stats.nextPosts.slice(0, 5).map((post) => (
                    <div key={post.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {post.content}
                        </p>
                        <p className="text-xs text-gray-500">
                          Scheduled {formatRelativeTime(post.scheduledAt)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No upcoming scheduled posts. <a href="/content" className="text-blue-600 hover:text-blue-800">Create your first post</a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}