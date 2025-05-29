import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ClipboardDocumentListIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { QCDocWithDetails, Step } from '../../types';
import { apiRequest, handleApiError } from '../../utils/api';
import { formatDate, formatDuration } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import PhotoModal from '../../components/checklists/PhotoModal';
import ChecklistStepCard from '../../components/checklists/ChecklistStepCard';

export default function ChecklistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [checklist, setChecklist] = useState<QCDocWithDetails | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalPhotoUrl, setModalPhotoUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchChecklistData = async () => {
      try {
        setIsLoading(true);
        if (!id) return;
        
        const checklistData = await apiRequest<QCDocWithDetails>(`/checklists/${id}`, 'GET', undefined, undefined, {
          localDataKey: `checklist-${id}`,
          queueOffline: false,
        });
        
        setChecklist(checklistData);
        
        // Fetch steps for the template
        const stepsData = await apiRequest<Step[]>(`/steps?template_id=${checklistData.template_id}`, 'GET', undefined, undefined, {
          localDataKey: `template-${checklistData.template_id}-steps`,
          queueOffline: false,
        });
        
        setSteps(stepsData);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChecklistData();
  }, [id]);
  
  const handleRejectChecklist = async () => {
    if (!checklist || !window.confirm('Are you sure you want to reject this checklist?')) return;
    
    try {
      const updatedChecklist = await apiRequest<QCDocWithDetails>(
        `/checklists/${checklist.id}`,
        'PUT',
        { status: 'rejected' }
      );
      
      setChecklist(updatedChecklist);
    } catch (err) {
      setError(handleApiError(err));
    }
  };
  
  const handleExportPDF = () => {
    // Placeholder function for PDF export
    alert('PDF export functionality would be implemented here');
  };
  
  const getResultForStep = (stepId: number) => {
    return checklist?.results.find(result => result.step_id === stepId);
  };
  
  const getStepById = (stepId: number) => {
    return steps.find(step => step.id === stepId);
  };
  
  if (isLoading) return <LoadingSpinner />;
  
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading checklist</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!checklist) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500">Checklist not found.</p>
        <Link to="/checklists" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          Back to Checklists
        </Link>
      </div>
    );
  }
  
  const okCount = checklist.results.filter(result => result.ok_flag).length;
  const totalResults = checklist.results.length;
  const okPercentage = totalResults > 0 ? (okCount / totalResults) * 100 : 0;
  
  return (
    <div>
      <PhotoModal photoUrl={modalPhotoUrl} onClose={() => setModalPhotoUrl(null)} />
      
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Checklist: {checklist.serial_no}
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              Template: {checklist.template.name} (Rev {checklist.template.revision})
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              Status: <span className="ml-1"><StatusBadge status={checklist.status} /></span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Export PDF
          </button>
          {checklist.status === 'in_progress' && (
            <>
              <Link
                to={`/checklists/${checklist.id}/execute`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ClipboardDocumentListIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Continue
              </Link>
              <button
                type="button"
                onClick={handleRejectChecklist}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <XMarkIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Reject
              </button>
            </>
          )}
          {checklist.status === 'completed' && (
            <Link
              to={`/checklists/new?templateId=${checklist.template_id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ClipboardDocumentListIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New from Template
            </Link>
          )}
        </div>
      </div>

      {/* Checklist Details */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Checklist Details</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Details and results of this quality control checklist.</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {checklist.serial_no}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created by</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {checklist.created_by_user.full_name || checklist.created_by_user.username}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Signed off by</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {checklist.signed_off_by_user ? 
                  (checklist.signed_off_by_user.full_name || checklist.signed_off_by_user.username) : 
                  'Not signed off yet'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created at</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(checklist.created_at)}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Completed at</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {checklist.completed_at ? formatDate(checklist.completed_at) : 'Not completed yet'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Execution Time</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDuration(checklist.execution_time)}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Pass Rate</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="flex items-center">
                  <span className="mr-4">
                    {okCount} / {totalResults} steps OK ({okPercentage.toFixed(1)}%)
                  </span>
                  <div className="w-full sm:w-64 bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${okPercentage === 100 ? 'bg-green-600' : 'bg-yellow-400'}`} 
                      style={{ width: `${okPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Steps and Results */}
      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-xl font-semibold text-gray-900">Results</h2>
            <p className="mt-2 text-sm text-gray-700">
              Results for each quality control step in this checklist.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {steps.map((step) => {
            const result = getResultForStep(step.id);
            return (
              <ChecklistStepCard
                key={step.id}
                step={step}
                result={result}
                canEdit={false}
                onSaveResult={async () => {}} // Placeholder function since we're in view-only mode
                onViewPhoto={(url) => setModalPhotoUrl(url)}
                index={steps.indexOf(step)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
