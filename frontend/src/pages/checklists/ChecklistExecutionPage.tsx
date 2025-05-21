import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardDocumentCheckIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { QCDocWithDetails, Step, QCResult, QCDocStatus } from '../../types';
import { apiRequest, handleApiError } from '../../utils/api';
import { formatDate } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import ChecklistStepCard from '../../components/checklists/ChecklistStepCard';
import PhotoModal from '../../components/checklists/PhotoModal';

export default function ChecklistExecutionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [checklist, setChecklist] = useState<QCDocWithDetails | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [modalPhotoUrl, setModalPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchChecklistData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch checklist details
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

    if (id) {
      fetchChecklistData();
    }
  }, [id]);

  const canEdit = (): boolean => {
    if (!checklist || !user) return false;
    
    // Only allow editing for in-progress checklists
    if (checklist.status !== 'in_progress') return false;
    
    // User must be the checklist creator or have admin/qc_engineer role
    return (
      checklist.created_by_id === user.id ||
      user.role === 'admin' ||
      user.role === 'qc_engineer'
    );
  };

  const getResultForStep = (stepId: number): QCResult | undefined => {
    return checklist?.results.find(result => result.step_id === stepId);
  };

  const handleSaveResult = async (result: { step_id: number; ok_flag: boolean; comment?: string; photo?: File }) => {
    if (!checklist || !canEdit() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const existingResult = getResultForStep(result.step_id);
      
      if (existingResult) {
        // Update existing result
        const updatedResult = await apiRequest<QCResult>(
          `/checklists/${checklist.id}/results/${existingResult.id}`,
          'PUT',
          {
            ok_flag: result.ok_flag,
            comment: result.comment,
            execution_time: 30, // Using a default value for now
          },
          undefined,
          { queueOffline: true }
        );
        
        // Handle photo upload if provided
        if (result.photo) {
          await handlePhotoUpload(updatedResult.id, result.photo);
        }
        
        // Update local state
        setChecklist(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            results: prev.results.map(r =>
              r.id === updatedResult.id ? updatedResult : r
            ),
          };
        });
      } else {
        // Create new result
        const newResult = await apiRequest<QCResult>(
          `/checklists/${checklist.id}/results`,
          'POST',
          {
            step_id: result.step_id,
            qc_doc_id: checklist.id,
            ok_flag: result.ok_flag,
            comment: result.comment,
            execution_time: 30, // Using a default value for now
          },
          undefined,
          { queueOffline: true }
        );
        
        // Handle photo upload if provided
        if (result.photo) {
          await handlePhotoUpload(newResult.id, result.photo);
        }
        
        // Update local state
        setChecklist(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            results: [...prev.results, newResult],
          };
        });
        
        // Automatically move to next step if there is one
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex(currentStepIndex + 1);
        }
      }
      
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (resultId: number, photo: File) => {
    if (!checklist) return;
    
    try {
      const formData = new FormData();
      formData.append('file', photo);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/checklists/${checklist.id}/results/${resultId}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }
      
      const data = await response.json();
      
      // Update the result with the photo path
      setChecklist(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          results: prev.results.map(r =>
            r.id === resultId ? { ...r, photo_path: data.path } : r
          ),
        };
      });
    } catch (err) {
      console.error('Error uploading photo:', err);
    }
  };

  const handleCompleteChecklist = async () => {
    if (!checklist || !canEdit() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Check if all steps have results
      const missingResults = steps.filter(step => !getResultForStep(step.id));
      
      if (missingResults.length > 0) {
        setError(`Please complete all steps before finishing the checklist. Missing: ${missingResults.map(s => s.code).join(', ')}`);
        return;
      }
      
      // Mark checklist as completed
      const updatedChecklist = await apiRequest<QCDocWithDetails>(
        `/checklists/${checklist.id}/complete`,
        'POST',
        { signed_off_by_id: user?.id },
        undefined,
        { queueOffline: true }
      );
      
      setChecklist(updatedChecklist);
      
      // Navigate to the checklist details page
      navigate(`/checklists/${checklist.id}`);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!checklist || !steps.length) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-500">Checklist not found or no steps available.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  const completedSteps = checklist.results.length;
  const totalSteps = steps.length;
  const progress = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div>
      <PhotoModal photoUrl={modalPhotoUrl} onClose={() => setModalPhotoUrl(null)} />
      
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            Checklist Execution
          </h1>
          <StatusBadge status={checklist.status} />
        </div>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h2 className="text-xl font-medium">{checklist.template.name} (Rev {checklist.template.revision})</h2>
            <p className="text-sm text-gray-500">Serial Number: {checklist.serial_no}</p>
          </div>
          <div className="mt-2 sm:mt-0 text-sm text-gray-500">
            <p>Created: {formatDate(checklist.created_at)}</p>
            <p>Created by: {checklist.created_by_user.full_name || checklist.created_by_user.username}</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Progress: {completedSteps} of {totalSteps} steps</span>
          <span className="text-sm font-medium text-gray-700">{progress}%</span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Step navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => navigateToStep(currentStepIndex - 1)}
          disabled={currentStepIndex === 0}
          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-1" />
          Previous
        </button>
        <span className="text-sm font-medium">
          Step {currentStepIndex + 1} of {steps.length}
        </span>
        <button
          onClick={() => navigateToStep(currentStepIndex + 1)}
          disabled={currentStepIndex === steps.length - 1}
          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRightIcon className="h-5 w-5 ml-1" />
        </button>
      </div>

      {/* Current step */}
      <div className="mb-6">
        <ChecklistStepCard
          step={currentStep}
          result={getResultForStep(currentStep.id)}
          canEdit={canEdit()}
          onSaveResult={handleSaveResult}
          onViewPhoto={(url) => setModalPhotoUrl(url)}
          index={currentStepIndex}
        />
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => navigate(`/checklists/${checklist.id}`)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <XMarkIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Cancel
        </button>
        {canEdit() && (
          <button
            onClick={handleCompleteChecklist}
            disabled={isSubmitting || completedSteps < totalSteps}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ClipboardDocumentCheckIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            {isSubmitting ? 'Saving...' : 'Finish Checklist'}
          </button>
        )}
      </div>

      {/* All steps (smaller version) */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">All Steps</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((step, index) => {
            const result = getResultForStep(step.id);
            return (
              <div 
                key={step.id} 
                onClick={() => navigateToStep(index)}
                className={`cursor-pointer rounded-md border p-2 ${currentStepIndex === index ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-primary-300'} ${result?.ok_flag === true ? 'bg-green-50' : result?.ok_flag === false ? 'bg-red-50' : 'bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{step.code}</span>
                  {result ? (
                    <StatusBadge status={result.ok_flag ? 'ok' : 'nok'} />
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-sm truncate">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
