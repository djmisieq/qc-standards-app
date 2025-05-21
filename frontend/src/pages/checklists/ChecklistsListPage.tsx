import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { QCDoc, QCDocStatus, Template } from '../../types';
import { apiRequest, handleApiError } from '../../utils/api';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';

export default function ChecklistsListPage() {
  const { user } = useAuth();
  const [checklists, setChecklists] = useState<QCDoc[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<QCDocStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch checklists
  useEffect(() => {
    const fetchChecklists = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest<QCDoc[]>('/checklists', 'GET', undefined, undefined, {
          localDataKey: 'checklists',
          queueOffline: false,
        });
        setChecklists(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchChecklists();
  }, []);

  // Fetch templates for filter
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await apiRequest<Template[]>('/templates', 'GET');
        setTemplates(data);
      } catch (err) {
        console.error('Error fetching templates:', err);
      }
    };

    fetchTemplates();
  }, []);

  // Filter checklists
  const filteredChecklists = checklists.filter((checklist) => {
    // Status filter
    if (statusFilter !== 'all' && checklist.status !== statusFilter) return false;
    
    // Template filter
    if (selectedTemplate !== null && checklist.template_id !== selectedTemplate) return false;
    
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return checklist.serial_no.toLowerCase().includes(query);
    }
    
    return true;
  });

  // Reset filters
  const resetFilters = () => {
    setStatusFilter('all');
    setSelectedTemplate(null);
    setSearchQuery('');
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Serial No', 'Template', 'Status', 'Created', 'Completed'];
    const rows = filteredChecklists.map(checklist => [
      checklist.serial_no,
      templates.find(t => t.id === checklist.template_id)?.name || `Template ID: ${checklist.template_id}`,
      checklist.status,
      formatDate(checklist.created_at),
      checklist.completed_at ? formatDate(checklist.completed_at) : 'N/A'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `checklists-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading checklists</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Checklists</h1>
          <p className="mt-2 text-base text-gray-500">
            A list of all QC checklists in the system.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex gap-2">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-2 text-sm font-medium text-primary-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Export
          </button>
          <Link
            to="/templates"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Checklist
          </Link>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mt-6 sm:flex sm:items-center">
        <div className="w-full sm:max-w-xs">
          <label htmlFor="search" className="sr-only">
            Search checklists
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              id="search"
              name="search"
              className="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
              placeholder="Search by serial number"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4">
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
            Filters
          </button>
        </div>
        {showFilters && (
          <div className="mt-4 sm:mt-0 sm:ml-4 flex flex-wrap gap-4">
            <div>
              <label htmlFor="status-filter" className="sr-only">
                Status Filter
              </label>
              <select
                id="status-filter"
                name="status-filter"
                className="block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as QCDocStatus | 'all')}
              >
                <option value="all">All Statuses</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="template-filter" className="sr-only">
                Template Filter
              </label>
              <select
                id="template-filter"
                name="template-filter"
                className="block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
                value={selectedTemplate || ''}
                onChange={(e) => setSelectedTemplate(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">All Templates</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} (Rev {template.revision})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <button
                type="button"
                className="text-sm text-primary-600 hover:text-primary-900"
                onClick={resetFilters}
              >
                Reset filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Checklists table */}
      {filteredChecklists.length > 0 ? (
        <div className="mt-8 flow-root">
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
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Created Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Completed Date
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredChecklists.map((checklist) => {
                    const template = templates.find(t => t.id === checklist.template_id);
                    return (
                      <tr key={checklist.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                          <Link to={`/checklists/${checklist.id}`} className="text-primary-600 hover:text-primary-900">
                            {checklist.serial_no}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {template ? `${template.name} (Rev ${template.revision})` : `Template ID: ${checklist.template_id}`}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <StatusBadge status={checklist.status} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(checklist.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {checklist.completed_at ? formatDate(checklist.completed_at) : '-'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                          {checklist.status === 'in_progress' && (
                            <Link to={`/checklists/${checklist.id}/execute`} className="text-primary-600 hover:text-primary-900">
                              Continue
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 text-center py-12 bg-white rounded-lg shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No checklists found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new checklist from a template.</p>
          <div className="mt-6">
            <Link
              to="/templates"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Checklist
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
