import React, { useState, useEffect } from 'react';
import { Step, StepCategory } from '../../types';

interface StepFormProps {
  initialStep?: Partial<Step>;
  templateId: number;
  onSave: (step: Partial<Step>) => void;
  onCancel: () => void;
}

const StepForm: React.FC<StepFormProps> = ({ initialStep, templateId, onSave, onCancel }) => {
  const [code, setCode] = useState(initialStep?.code || '');
  const [description, setDescription] = useState(initialStep?.description || '');
  const [requirement, setRequirement] = useState(initialStep?.requirement || '');
  const [category, setCategory] = useState<StepCategory>(initialStep?.category || 'major');
  const [photoRequired, setPhotoRequired] = useState(initialStep?.photo_required || false);
  const [stdTime, setStdTime] = useState(initialStep?.std_time?.toString() || '30');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (initialStep) {
      setCode(initialStep.code || '');
      setDescription(initialStep.description || '');
      setRequirement(initialStep.requirement || '');
      setCategory(initialStep.category || 'major');
      setPhotoRequired(initialStep.photo_required || false);
      setStdTime(initialStep.std_time?.toString() || '30');
    }
  }, [initialStep]);
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!code.trim()) {
      newErrors.code = 'Code is required';
    } else if (!/^\d+\.\d+$/.test(code)) {
      newErrors.code = 'Code must be in format X.Y (e.g., 1.1)';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!requirement.trim()) {
      newErrors.requirement = 'Requirement is required';
    }
    
    if (isNaN(parseInt(stdTime)) || parseInt(stdTime) <= 0) {
      newErrors.stdTime = 'Standard time must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    onSave({
      ...initialStep,
      code,
      description,
      requirement,
      category,
      photo_required: photoRequired,
      std_time: parseInt(stdTime),
      template_id: templateId,
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-md shadow">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="step-code" className="block text-sm font-medium text-gray-700">
              Step Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="step-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.code ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}`}
              placeholder="1.1"
            />
            {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
          </div>
          
          <div>
            <label htmlFor="step-category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="step-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as StepCategory)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
              <option value="cosmetic">Cosmetic</option>
            </select>
          </div>
        </div>
        
        <div>
          <label htmlFor="step-description" className="block text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="step-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}`}
            placeholder="What to check"
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>
        
        <div>
          <label htmlFor="step-requirement" className="block text-sm font-medium text-gray-700">
            Requirement <span className="text-red-500">*</span>
          </label>
          <textarea
            id="step-requirement"
            rows={2}
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.requirement ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}`}
            placeholder="Criteria for OK/NOK"
          />
          {errors.requirement && <p className="mt-1 text-sm text-red-600">{errors.requirement}</p>}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="step-std-time" className="block text-sm font-medium text-gray-700">
              Standard Time (seconds)
            </label>
            <input
              type="number"
              id="step-std-time"
              value={stdTime}
              onChange={(e) => setStdTime(e.target.value)}
              min="1"
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.stdTime ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'}`}
            />
            {errors.stdTime && <p className="mt-1 text-sm text-red-600">{errors.stdTime}</p>}
          </div>
          
          <div className="flex items-center">
            <input
              id="step-photo-required"
              type="checkbox"
              checked={photoRequired}
              onChange={(e) => setPhotoRequired(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="step-photo-required" className="ml-2 block text-sm text-gray-700">
              Photo evidence required
            </label>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default StepForm;
