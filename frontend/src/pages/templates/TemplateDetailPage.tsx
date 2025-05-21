import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PencilIcon, DocumentDuplicateIcon, ArchiveBoxIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { Template, Step, TemplateStatus } from '../../types';
import { apiRequest, handleApiError } from '../../utils/api';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTemplateData = async () => {
      try {
        setIsLoading(true);
        if (!id) return;
        
        const [templateData, stepsData] = await Promise.all([
          apiRequest<Template>(`/templates/${id}`, 'GET'),
          apiRequest<Step[]>(`/steps?template_id=${id}`, 'GET')
        ]);
        
        setTemplate(templateData);
        setSteps(stepsData);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplateData();
  }, [id]);
  
  const handleArchiveTemplate = async () => {
    if (!template || !window.confirm('Are you sure you want to archive this template?')) return;
    
    try {
      const archivedTemplate = await apiRequest<Template>(`/templates/${template.id}/archive`, 'POST');
      setTemplate(archivedTemplate);
    } catch (err) {
      setError(handleApiError(err));
    }
  };
  
  const handleCloneTemplate = async () => {
    if (!template) return;
    
    try {
      const newRevision = prompt('Enter a new revision for the cloned template:', nextRevision(template.revision));
      if (!newRevision) return;
      
      const clonedTemplate = await apiRequest<Template>(
        `/templates/${template.id}/clone`,
        'POST',
        { new_revision: newRevision }
      );
      
      navigate(`/templates/${clonedTemplate.id}/edit`);
    } catch (err) {
      setError(handleApiError(err));
    }
  };
  
  const nextRevision = (current: string): string => {
    if (/^[A-Z]$/.test(current)) {
      // If a single letter (e.g., 'A'), increment to next letter
      return String.fromCharCode(current.charCodeAt(0) + 1);
    } else if (/^\d+$/.test(current)) {
      // If a number, increment by 1
      return (parseInt(current) + 1).toString();
    } else {
      // If another format, just suggest next
      return current + '-next';
    }
  };
  
  const canEdit = (): boolean => {
    if (!user || !template) return false;
    
    // Published templates cannot be edited
    if (template.status === 'published') {
      return false;
    }
    
    // Only creator, QC engineers, and admins can edit drafts
    return (
      (template.created_by_id === user.id) ||
      user.role === 'qc_engineer' ||
      user.role === 'admin'
    );
  };
  
  const canClone = (): boolean => {
    if (!user) return false;
    return user.role === 'qc_engineer' || user.role === 'admin';
  };
  
  const canArchive = (): boolean => {
    if (!user || !template) return false;
    
    // Already archived templates cannot be archived again
    if (template.status === 'archived') {
      return false;
    }
    
    // Only QC engineers and admins can archive templates
    return user.role === 'qc_engineer' || user.role === 'admin';
  };
  
  if (isLoading) return <LoadingSpinner />;
  
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading template</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500">Template not found.</p>
        <Link to="/templates" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          Back to Templates
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {template.name}
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              ID: {template.template_id}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              Rev: {template.revision}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              Status: <span className="ml-1"><StatusBadge status={template.status} /></span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
          {canEdit() && (
            <Link
              to={`/templates/${template.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PencilIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Edit
            </Link>
          )}
          {canClone() && (
            <button
              type="button"
              onClick={handleCloneTemplate}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <DocumentDuplicateIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Clone
            </button>
          )}
          {canArchive() && (
            <button
              type="button"
              onClick={handleArchiveTemplate}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArchiveBoxIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Archive
            </button>
          )}
          {template.status === 'published' && (
            <Link
              to={`/checklists/new?templateId=${template.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ClipboardDocumentListIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Checklist
            </Link>
          )}
        </div>
      </div>

      {/* Template Details */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Template Details</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Information about this QC template.</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Model</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {template.model_id ? '[Model Information]' : 'Not specified'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Stage</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {template.stage_id ? '[Stage Information]' : 'Not specified'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created by</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {template.created_by_id || 'Unknown'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Approved by</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {template.approved_by_id || 'Not approved yet'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created at</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(template.created_at)}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Published at</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {template.published_at ? formatDate(template.published_at) : 'Not published yet'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Steps */}
      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-xl font-semibold text-gray-900">Quality Control Steps</h2>
            <p className="mt-2 text-sm text-gray-700">
              List of all QC steps for this template.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Code
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Description
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Category
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Photo
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Std Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {steps.map((step) => (
                <tr key={step.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {step.code}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <div className="max-w-md">
                      {step.description}
                      <div className="mt-1 text-xs text-gray-400">
                        <strong>Requirement:</strong> {step.requirement}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <StatusBadge status={step.category} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {step.photo_required ? 'Required' : 'Optional'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {step.std_time}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
