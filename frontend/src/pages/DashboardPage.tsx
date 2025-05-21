import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { DashboardStats, QCDocWithDetails, StepWithStats } from '../types';
import { formatDate, formatDuration } from '../utils/dateUtils';
import { apiRequest, handleApiError } from '../utils/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest<DashboardStats>('/dashboard/stats', 'GET', undefined, undefined, {
          localDataKey: 'dashboardStats',
          queueOffline: false,
        });
        setStats(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard data</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no stats available yet, show placeholder
  if (!stats) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to QC Standards</h1>
        <p className="mt-4 text-lg text-gray-500">
          No data available yet. Start by creating templates and executing checklists.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/templates/new" className="btn btn-primary">
            Create Template
          </Link>
          <Link to="/templates" className="btn btn-secondary">
            View Templates
          </Link>
        </div>
      </div>
    );
  }

  // Mock data for charts (replace with real data from API)
  const fpy30DaysData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    fpy: 90 + Math.random() * 10 - 5,
  }));

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-base text-gray-500">
            Overview of QC performance and recent activities
          </p>
        </div>
      </div>

      {/* Key metrics */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Total Templates</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.total_templates}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Total Checklists</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.total_checklists}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Total QC Steps</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{stats.total_steps}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">First Pass Yield</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {stats.fpy_percentage.toFixed(1)}%
          </dd>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* FPY Trend Chart */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">FPY Trend (30 Days)</h3>
            <div className="mt-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fpy30DaysData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'FPY']} />
                  <Line type="monotone" dataKey="fpy" stroke="#0ea5e9" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Failing Steps */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Top Failing Steps</h3>
            <div className="mt-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.top_failing_steps.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="code" width={80} />
                  <Tooltip formatter={(value) => [`${value}%`, 'NOK Rate']} />
                  <Legend />
                  <Bar dataKey="nok_percentage" name="NOK Rate" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Checklists */}
      <div className="mt-8 overflow-hidden rounded-lg bg-white shadow">
        <div className="p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Recent Checklists</h3>
          <div className="mt-2 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                        Serial Number
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Template
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Created By
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Execution Time
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.recent_checklists.map((checklist) => (
                      <tr key={checklist.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                          <Link to={`/checklists/${checklist.id}`} className="text-primary-600 hover:text-primary-900">
                            {checklist.serial_no}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {checklist.template.name} (Rev {checklist.template.revision})
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {checklist.created_by_user.full_name || checklist.created_by_user.username}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              checklist.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : checklist.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {checklist.status === 'completed'
                              ? 'Completed'
                              : checklist.status === 'in_progress'
                              ? 'In Progress'
                              : 'Rejected'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDuration(checklist.execution_time)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(checklist.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Link to="/checklists" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              View all checklists
              <span aria-hidden="true"> &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
