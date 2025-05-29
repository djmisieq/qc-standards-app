import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlusCircleIcon, XMarkIcon, ExclamationTriangleIcon, ArrowUpIcon, ArrowDownIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { Template, Step, TemplateStatus, ProductModel, Stage } from '../../types';
import { apiRequest, handleApiError } from '../../utils/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import StepForm from '../../components/templates/StepForm';

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [models, setModels] = useState<ProductModel[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [revision, setRevision] = useState('');
  const [modelId, setModelId] = useState<number | null>(null);
  const [stageId, setStageId] = useState<number | null>(null);
  
  // Step editing
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [showStepForm, setShowStepForm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Fetch template data if editing an existing template
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch models and stages
        const [modelsData, stagesData] = await Promise.all([
          apiRequest<ProductModel[]>('/models', 'GET'),
          apiRequest<Stage[]>('/stages', 'GET'),
        ]);
        
        setModels(modelsData);
        setStages(stagesData);
        
        // If we have an ID, fetch the template and its steps
        if (id) {
          const [templateData, stepsData] = await Promise.all([
            apiRequest<Template>(`/templates/${id}`, 'GET'),
            apiRequest<Step[]>(`/steps?template_id=${id}`, 'GET'),
          ]);
          
          setTemplate(templateData);
          setSteps(stepsData);
          
          // Populate form fields
          setName(templateData.name);
          setTemplateId(templateData.template_id);
          setRevision(templateData.revision);
          setModelId(templateData.model_id);
          setStageId(templateData.stage_id);
        }
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!templateId.trim()) {
      errors.templateId = 'Template ID is required';
    }
    
    if (!revision.trim()) {
      errors.revision = 'Revision is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSaveTemplate = async (status: TemplateStatus = 'draft') => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      const templateData = {
        name,
        template_id: templateId,
        revision,
        model_id: modelId,
        stage_id: stageId,
        status,
      };
      
      if (template) {
        // Update existing template
        const updatedTemplate = await apiRequest<Template>(
          `/templates/${template.id}`,
          'PUT',
          templateData
        );
        
        setTemplate(updatedTemplate);
        
        if (status === 'published' && template.status !== 'published') {
          // If publishing, call the publish endpoint
          await apiRequest(`/templates/${template.id}/publish`, 'POST');
        }
        
        navigate(`/templates/${template.id}`);
      } else {
        // Create new template
        const newTemplate = await apiRequest<Template>(
          '/templates',
          'POST',
          { ...templateData, steps }
        );
        
        if (status === 'published') {
          // If publishing, call the publish endpoint
          await apiRequest(`/templates/${newTemplate.id}/publish`, 'POST');
        }
        
        navigate(`/templates/${newTemplate.id}`);
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAddStep = () => {
    setCurrentStepIndex(null);
    setShowStepForm(true);
  };
  
  const handleEditStep = (index: number) => {
    setCurrentStepIndex(index);
    setShowStepForm(true);
  };
  
  const handleSaveStep = async (stepData: Partial<Step>) => {
    if (currentStepIndex !== null) {
      // Update existing step
      const updatedSteps = [...steps];
      updatedSteps[currentStepIndex] = { ...updatedSteps[currentStepIndex], ...stepData } as Step;
      setSteps(updatedSteps);
      
      if (template) {
        try {
          // Save to API if we have a template ID
          const stepId = steps[currentStepIndex].id;
          await apiRequest<Step>(`/steps/${stepId}`, 'PUT', stepData);
        } catch (err) {
          console.error('Error updating step:', err);
          // Continue with local update even if API fails
        }
      }
    } else {
      // Add new step
      const newStep = stepData as Step;
      setSteps([...steps, newStep]);
      
      if (template) {
        try {
          // Save to API if we have a template ID
          const createdStep = await apiRequest<Step>('/steps', 'POST', { ...newStep, template_id: template.id });
          // Update local state with the created step (to get the ID)
          setSteps(prev => prev.map(s => 
            s === newStep ? createdStep : s
          ));
        } catch (err) {
          console.error('Error creating step:', err);
          // Continue with local update even if API fails
        }
      }
    }
    
    setShowStepForm(false);
    setCurrentStepIndex(null);
  };
  
  const handleDeleteStep = async (index: number) => {
    if (window.confirm('Are you sure you want to delete this step?')) {
      const stepToDelete = steps[index];
      
      // Update local state
      const updatedSteps = steps.filter((_, i) => i !== index);
      setSteps(updatedSteps);
      
      // If template exists and step has an ID, delete from API
      if (template && stepToDelete.id) {
        try {
          await apiRequest(`/steps/${stepToDelete.id}`, 'DELETE');
        } catch (err) {
          console.error('Error deleting step:', err);
          // Continue with local update even if API fails
        }
      }
    }
  };
  
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const updatedSteps = [...steps];
      [updatedSteps[index - 1], updatedSteps[index]] = [updatedSteps[index], updatedSteps[index - 1]];
      setSteps(updatedSteps);
    } else if (direction === 'down' && index < steps.length - 1) {
      const updatedSteps = [...steps];
      [updatedSteps[index], updatedSteps[index + 1]] = [updatedSteps[index + 1], updatedSteps[index]];
      setSteps(updatedSteps);
    }
  };
  
  const canEdit = (): boolean => {
    if (!user) return false;
    
    // New templates can be created by QC engineers and admins
    if (!template) {
      return user.role === 'qc_engineer' || user.role === 'admin';
    }
    
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
  
  if (isLoading) return <LoadingSpinner />;
  
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
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
  
  if (!canEdit()) {
    return (
      <div className="rounded-md bg-yellow-50 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Permission Denied</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>You don't have permission to edit this template.</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate('/templates')}
                className="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2"
              >
                Back to Templates
              </button>
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
          <h1 className="text-2xl font-semibold text-gray-900">
            {template ? `Edit Template: ${template.name}` : 'Create New Template'}
          </h1>
          {template && (
            <div className="mt-2 flex items-center">
              <p className="text-base text-gray-500 mr-2">
                Status:
              </p>
              <StatusBadge status={template.status} />
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => navigate('/templates')}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSaveTemplate('draft')}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 w-full sm:w-auto"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={() => handleSaveTemplate('published')}
            disabled={isSaving || steps.length === 0}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full sm:w-auto"
          >
            {isSaving ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
      
      {/* Template Form */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="template-name" className="block text-sm font-medium text-gray-700">
              Template Name <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`block w-full rounded-md shadow-sm sm:text-sm ${formErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}`}
              />
              {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
            </div>
          </div>
          
          <div className="sm:col-span-2">
            <label htmlFor="template-id" className="block text-sm font-medium text-gray-700">
              Template ID <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="template-id"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className={`block w-full rounded-md shadow-sm sm:text-sm ${formErrors.templateId ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}`}
                placeholder="e.g., SJ-00"
              />
              {formErrors.templateId && <p className="mt-1 text-sm text-red-600">{formErrors.templateId}</p>}
            </div>
          </div>
          
          <div className="sm:col-span-1">
            <label htmlFor="revision" className="block text-sm font-medium text-gray-700">
              Revision <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="revision"
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                className={`block w-full rounded-md shadow-sm sm:text-sm ${formErrors.revision ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}`}
                placeholder="e.g., A"
              />
              {formErrors.revision && <p className="mt-1 text-sm text-red-600">{formErrors.revision}</p>}
            </div>
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="model" className="block text-sm font-medium text-gray-700">
              Product Model
            </label>
            <div className="mt-1">
              <select
                id="model"
                value={modelId || ''}
                onChange={(e) => setModelId(e.target.value ? parseInt(e.target.value) : null)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Select a model...</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="stage" className="block text-sm font-medium text-gray-700">
              Production Stage
            </label>
            <div className="mt-1">
              <select
                id="stage"
                value={stageId || ''}
                onChange={(e) => setStageId(e.target.value ? parseInt(e.target.value) : null)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Select a stage...</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Steps Management */}
      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-xl font-semibold text-gray-900">Steps</h2>
            <p className="mt-2 text-sm text-gray-700">
              Add, edit, or remove quality control steps for this template.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={handleAddStep}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
            >
              <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add Step
            </button>
          </div>
        </div>
        
        {/* Step Form */}
        {showStepForm && (
          <div className="mt-4">
            <StepForm
              initialStep={currentStepIndex !== null ? steps[currentStepIndex] : undefined}
              templateId={template?.id || 0}
              onSave={handleSaveStep}
              onCancel={() => setShowStepForm(false)}
            />
          </div>
        )}
        
        {/* Steps List */}
        <div className="mt-4">
          {steps.length > 0 ? (
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
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
                    <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell">
                      Photo
                    </th>
                    <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 md:table-cell">
                      Std Time
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {steps.map((step, index) => (
                    <tr key={index}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {step.code}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <div className="max-w-md truncate">
                          {step.description}
                        </div>
                        <div className="mt-1 text-xs text-gray-400 max-w-md truncate">
                          Req: {step.requirement}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <StatusBadge status={step.category} />
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 sm:table-cell">
                        {step.photo_required ? 'Required' : 'Optional'}
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 md:table-cell">
                        {step.std_time}s
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex items-center space-x-2 justify-end">
                          <button
                            onClick={() => handleMoveStep(index, 'up')}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                          >
                            <ArrowUpIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => handleMoveStep(index, 'down')}
                            disabled={index === steps.length - 1}
                            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                          >
                            <ArrowDownIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => handleEditStep(index)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => handleDeleteStep(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <PlusCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No steps added yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first QC step.</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Add Step
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
