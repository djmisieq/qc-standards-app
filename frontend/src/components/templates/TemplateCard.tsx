import React from 'react';
import { Link } from 'react-router-dom';
import { TemplateWithStats } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import StatusBadge from '../ui/StatusBadge';

interface TemplateCardProps {
  template: TemplateWithStats;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template }) => {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="truncate text-sm font-medium text-primary-600">{template.template_id}</div>
          <StatusBadge status={template.status} />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="truncate text-lg font-semibold text-gray-900">{template.name}</p>
          <p className="ml-2 flex-shrink-0 text-sm text-gray-500">Rev {template.revision}</p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <span>{template.step_count} steps</span>
              <span>•</span>
              <span>{template.checklist_count} checklists</span>
            </div>
            <div className="mt-1">
              {template.fpy_percentage !== null ? (
                <span>
                  FPY: {template.fpy_percentage.toFixed(1)}%
                </span>
              ) : (
                <span>No FPY data</span>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            <div>Published: {template.published_at ? formatDate(template.published_at) : 'Not published'}</div>
            <div>Updated: {formatDate(template.updated_at)}</div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Link
              to={`/templates/${template.id}`}
              className="text-sm font-medium text-primary-600 hover:text-primary-900"
            >
              View details
            </Link>
          </div>
          <div className="flex space-x-2">
            {template.status !== 'archived' && (
              <Link
                to={`/checklists/new?templateId=${template.id}`}
                className="text-sm font-medium text-primary-600 hover:text-primary-900"
              >
                New checklist
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
