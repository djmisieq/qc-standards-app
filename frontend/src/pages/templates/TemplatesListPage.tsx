import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { TemplateWithStats, TemplateStatus, ProductModel, Stage } from '../../types';
import { apiRequest, handleApiError } from '../../utils/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import TemplateCard from '../../components/templates/TemplateCard';

export default function TemplatesListPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TemplateWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [models, setModels] = useState<ProductModel[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest<TemplateWithStats[]>('/templates', 'GET', undefined, undefined, {
          localDataKey: 'templates',
          queueOffline: false,
        });
        setTemplates(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Fetch models and stages for filters
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [modelsData, stagesData] = await Promise.all([
          apiRequest<ProductModel[]>('/models', 'GET'),
          apiRequest<Stage[]>('/stages', 'GET'),
        ]);
        setModels(modelsData);
        setStages(stagesData);
      } catch (err) {
        console.error('Error fetching filters:', err);
      }
    };

    fetchFilters();
  }, []);

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    // Status filter
    if (statusFilter !== 'all' && template.status !== statusFilter) return false;
    
    // Model filter
    if (selectedModel !== null && template.model_id !== selectedModel) return false;
    
    // Stage filter
    if (selectedStage !== null && template.stage_id !== selectedStage) return false;
    
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.template_id.toLowerCase().includes(query) ||
        template.revision.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Reset filters
  const resetFilters = () => {
    setStatusFilter('all');
    setSelectedModel(null);
    setSelectedStage(null);
    setSearchQuery('');
  };

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading templates</h3>
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
          <h1 className="text-2xl font-semibold text-gray-900">Templates</h1>
          <p className="mt-2 text-base text-gray-500">
            A list of all QC template standards available in the system.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          {(user?.role === 'admin' || user?.role === 'qc_engineer') && (
            <Link
              to="/templates/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Template
            </Link>
          )}
        </div>
      </div>

      {/* Search and filters */}
      <div className="mt-6 sm:flex sm:items-center">
        <div className="w-full sm:max-w-xs">
          <label htmlFor="search" className="sr-only">
            Search templates
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
              placeholder="Search templates"
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
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:mt-0 sm:ml-4">
            <div>
              <label htmlFor="status-filter" className="sr-only">
                Status Filter
              </label>
              <select
                id="status-filter"
                name="status-filter"
                className="block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TemplateStatus | 'all')}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="model-filter" className="sr-only">
                Model Filter
              </label>
              <select
                id="model-filter"
                name="model-filter"
                className="block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
                value={selectedModel || ''}
                onChange={(e) => setSelectedModel(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">All Models</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="stage-filter" className="sr-only">
                Stage Filter
              </label>
              <select
                id="stage-filter"
                name="stage-filter"
                className="block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
                value={selectedStage || ''}
                onChange={(e) => setSelectedStage(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">All Stages</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
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

      {/* Templates grid */}
      {filteredTemplates.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new template.</p>
          {(user?.role === 'admin' || user?.role === 'qc_engineer') && (
            <div className="mt-6">
              <Link
                to="/templates/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                New Template
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
