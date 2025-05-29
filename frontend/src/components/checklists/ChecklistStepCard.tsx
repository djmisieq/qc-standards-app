import React, { useState } from 'react';
import { CheckIcon, XMarkIcon, CameraIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Step, QCResult, StepCategory } from '../../types';
import StatusBadge from '../ui/StatusBadge';

interface ChecklistStepCardProps {
  step: Step;
  result?: QCResult;
  canEdit: boolean;
  onSaveResult: (result: { step_id: number; ok_flag: boolean; comment?: string; photo?: File }) => Promise<void>;
  onViewPhoto?: (photoUrl: string) => void;
  index: number;
}

const ChecklistStepCard: React.FC<ChecklistStepCardProps> = ({ 
  step, 
  result, 
  canEdit, 
  onSaveResult,
  onViewPhoto,
  index 
}) => {
  const [comment, setComment] = useState<string>(result?.comment || '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(false);

  const handleSaveResult = async (ok_flag: boolean) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSaveResult({
        step_id: step.id,
        ok_flag,
        comment: comment.trim() ? comment : undefined,
        photo: photo || undefined,
      });
    } catch (error) {
      console.error('Error saving result:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const getCategoryColor = (category: StepCategory) => {
    switch (category) {
      case 'critical':
        return 'border-l-4 border-red-500';
      case 'major':
        return 'border-l-4 border-orange-500';
      case 'minor':
        return 'border-l-4 border-yellow-500';
      case 'cosmetic':
        return 'border-l-4 border-blue-500';
      default:
        return '';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${getCategoryColor(step.category)}`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center">
              <span className="text-lg font-medium text-gray-900 mr-2">{step.code}</span>
              <StatusBadge status={step.category} />
            </div>
            <h3 className="text-base font-semibold mt-1">{step.description}</h3>
          </div>
          <div className="flex-shrink-0">
            {result ? (
              <StatusBadge status={result.ok_flag ? 'ok' : 'nok'} />
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                Pending
              </span>
            )}
          </div>
        </div>

        <div className="mt-2">
          <p className="text-sm text-gray-600">Requirement: {step.requirement}</p>
        </div>

        {(result || canEdit) && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            {canEdit && !result ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <button
                      type="button"
                      onClick={() => handleSaveResult(true)}
                      disabled={isSubmitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed mr-3"
                    >
                      <CheckIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                      Mark as OK
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveResult(false)}
                      disabled={isSubmitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XMarkIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                      Mark as NOK
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNotes(!showNotes)}
                    className="text-sm text-gray-600 hover:text-gray-900 sm:ml-4"
                  >
                    {showNotes ? 'Hide notes' : 'Add notes'}
                  </button>
                </div>

                {showNotes && (
                  <div>
                    <label htmlFor={`comment-${step.id}`} className="block text-sm font-medium text-gray-700">
                      Comments
                    </label>
                    <div className="mt-1">
                      <textarea
                        id={`comment-${step.id}`}
                        name="comment"
                        rows={2}
                        className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Add any observations or comments here"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {step.photo_required && (
                  <div>
                    <label htmlFor={`photo-${step.id}`} className="block text-sm font-medium text-gray-700">
                      Photo Evidence {step.photo_required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="mt-1 flex items-center">
                      <input
                        id={`photo-${step.id}`}
                        name="photo"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                      {photo ? (
                        <div className="relative">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt="Preview"
                            className="h-24 w-24 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => setPhoto(null)}
                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                          >
                            <XMarkIcon className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor={`photo-${step.id}`}
                          className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <CameraIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                          Take Photo
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {isSubmitting && (
                  <div className="flex justify-center">
                    <ArrowPathIcon className="h-5 w-5 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
            ) : result ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Result:</span>
                  <StatusBadge status={result.ok_flag ? 'ok' : 'nok'} />
                </div>

                {result.comment && (
                  <div>
                    <span className="font-medium">Comments:</span>
                    <p className="text-sm text-gray-600 mt-1">{result.comment}</p>
                  </div>
                )}

                {result.photo_path && (
                  <div>
                    <span className="font-medium">Photo Evidence:</span>
                    <div className="mt-1">
                      <img
                        src={`/api/v1/photos/${result.photo_path}`}
                        alt="Evidence"
                        className="h-20 w-20 object-cover rounded cursor-pointer"
                        onClick={() => onViewPhoto && onViewPhoto(`/api/v1/photos/${result.photo_path}`)}
                      />
                    </div>
                  </div>
                )}

                {canEdit && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {}}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <ArrowPathIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                      Change Result
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
      {step.std_time > 0 && (
        <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 flex justify-between">
          <span>Standard Time: {step.std_time}s</span>
          {result?.execution_time && <span>Actual Time: {result.execution_time}s</span>}
        </div>
      )}
    </div>
  );
};

export default ChecklistStepCard;
