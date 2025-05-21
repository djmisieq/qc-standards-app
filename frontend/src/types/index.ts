// User types
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'qc_engineer' | 'production_leader' | 'qc_operator' | 'viewer';

// Template types
export type TemplateStatus = 'draft' | 'published' | 'archived';

export interface Template {
  id: number;
  name: string;
  template_id: string;
  revision: string;
  status: TemplateStatus;
  model_id: number | null;
  stage_id: number | null;
  created_by_id: number | null;
  approved_by_id: number | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  metadata: Record<string, any>;
}

export interface TemplateWithStats extends Template {
  step_count: number;
  checklist_count: number;
  fpy_percentage: number | null;
  average_execution_time: number | null;
}

export interface TemplateWithDetails extends Template {
  steps: Step[];
  model?: ProductModel;
  stage?: Stage;
  created_by_user?: User;
  approved_by_user?: User;
}

// Step types
export type StepCategory = 'critical' | 'major' | 'minor' | 'cosmetic';

export interface Step {
  id: number;
  template_id: number;
  code: string;
  description: string;
  requirement: string;
  category: StepCategory;
  photo_required: boolean;
  std_time: number;
  metadata: Record<string, any>;
}

export interface StepWithStats extends Step {
  ok_count: number;
  nok_count: number;
  ok_percentage: number;
  average_execution_time: number | null;
}

// Checklist types
export type QCDocStatus = 'in_progress' | 'completed' | 'rejected';

export interface QCDoc {
  id: number;
  template_id: number;
  serial_no: string;
  status: QCDocStatus;
  created_by_id: number;
  signed_off_by_id: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  execution_time: number | null;
  metadata: Record<string, any>;
}

export interface QCResult {
  id: number;
  qc_doc_id: number;
  step_id: number;
  ok_flag: boolean;
  comment: string | null;
  photo_path: string | null;
  execution_time: number | null;
  created_at: string;
  metadata: Record<string, any>;
}

export interface QCDocWithDetails extends QCDoc {
  template: Template;
  created_by_user: User;
  signed_off_by_user: User | null;
  results: QCResult[];
}

// Other types
export interface ProductModel {
  id: number;
  name: string;
  description: string | null;
}

export interface Stage {
  id: number;
  name: string;
  description: string | null;
}

// API response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

// Dashboard types
export interface DashboardStats {
  total_templates: number;
  total_checklists: number;
  total_steps: number;
  fpy_percentage: number;
  recent_checklists: QCDocWithDetails[];
  top_failing_steps: StepWithStats[];
}

// Offline sync types
export interface SyncQueueItem {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  localDataKey?: string;
  timestamp: number;
}

export interface SyncResponse {
  sync_time: string;
  templates?: Template[];
  checklists?: QCDocWithDetails[];
}
