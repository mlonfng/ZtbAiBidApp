/**
 * 统一Step API类型定义
 * 符合统一规范v3.md和API规范文档v3.md
 */

// 基础响应类型
export interface BaseApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  code: number;
  timestamp?: string;
}

// 步骤状态枚举
export enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RUNNING = 'running', // 兼容旧API
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

// 步骤键枚举
export enum StepKey {
  SERVICE_MODE = 'service-mode',
  BID_ANALYSIS = 'bid-analysis',
  FILE_FORMATTING = 'file-formatting',
  MATERIAL_MANAGEMENT = 'material-management',
  FRAMEWORK_GENERATION = 'framework-generation',
  CONTENT_GENERATION = 'content-generation',
  FORMAT_CONFIG = 'format-config',
  DOCUMENT_EXPORT = 'document-export'
}

// 步骤状态响应
export interface StepStatusResponse {
  project_id: string;
  step_key: StepKey;
  status: StepStatus;
  progress: number;
  started_at?: string;
  completed_at?: string;
  updated_at?: string;
  message?: string;
  error?: string;
}

// 步骤执行选项基类
export interface BaseStepExecuteOptions {
  [key: string]: any;
}

// 各步骤特定的执行选项
export interface ServiceModeExecuteOptions extends BaseStepExecuteOptions {
  mode: 'ai' | 'free' | 'manual' | 'ai_intelligent' | 'standard';
}

export interface BidAnalysisExecuteOptions extends BaseStepExecuteOptions {
  analysis_type: 'comprehensive' | 'quick';
}

export interface FileFormattingExecuteOptions extends BaseStepExecuteOptions {
  sequence?: ('detect' | 'clean' | 'extract' | 'html')[];
  source_relative_path?: string;
}

export interface MaterialManagementExecuteOptions extends BaseStepExecuteOptions {
  action?: 'refresh' | 'reindex';
}

export interface FrameworkGenerationExecuteOptions extends BaseStepExecuteOptions {
  framework_type: 'standard' | 'technical' | 'commercial' | 'comprehensive';
  template_id?: string;
}

export interface ContentGenerationExecuteOptions extends BaseStepExecuteOptions {
  sections: string[];
}

export interface FormatConfigExecuteOptions extends BaseStepExecuteOptions {
  template_key?: string;
  css_path?: string;
  rules?: Record<string, any>;
}

export interface DocumentExportExecuteOptions extends BaseStepExecuteOptions {
  export_format: 'docx' | 'pdf' | 'html';
  sections?: string[];
}

// 步骤结果类型
export interface ServiceModeResult {
  mode: string;
  applied_at?: string;
}

export interface BidAnalysisResult {
  basic_info?: Record<string, any>;
  evaluation_criteria?: any[];
  technical_requirements?: any[];
  report_path?: string;
  strategy_path?: string;
  summary?: string;
}

export interface FileFormattingResult {
  cleaned_pdf?: string;
  format_pdf?: string;
  ocr_dir?: string;
  config_file?: string;
  file_info?: {
    total_files: number;
    files: any[];
  };
  format_info?: {
    primary_format: string;
    supported: boolean;
    is_valid: boolean;
  };
  conversion_info?: {
    source_format: string;
    target_format: string;
    status: string;
    output_files?: Array<{
      filename: string;
      format: string;
      fullpath?: string;
    }>;
  };
  validation_info?: {
    is_valid: boolean;
    errors?: string[];
    warnings?: string[];
  };
  processing_stats?: {
    processing_time: string;
    memory_usage: string;
  };
}

export interface MaterialManagementResult {
  materials: any[];
  categories: any[];
  checklist?: any[];
}

export interface FrameworkGenerationResult {
  framework: {
    id: string;
    type: string;
    chapters: any[];
    status: string;
  };
}

export interface ContentGenerationResult {
  sections: Array<{
    key: string;
    status: string;
    path?: string;
  }>;
  summary?: string;
}

export interface FormatConfigResult {
  css_path?: string;
  template_key?: string;
  rules?: Record<string, any>;
}

export interface DocumentExportResult {
  files: Array<{
    format: string;
    url: string | null;
    size: number;
  }>;
}

// 步骤API客户端接口
export interface StepAPIClient {
  getStatus(projectId: string, stepKey: StepKey): Promise<BaseApiResponse<StepStatusResponse>>;
  execute<T extends BaseStepExecuteOptions>(
    projectId: string, 
    stepKey: StepKey, 
    options: T
  ): Promise<BaseApiResponse<any>>;
  getResult(projectId: string, stepKey: StepKey): Promise<BaseApiResponse<any>>;
}

// 项目相关类型
export interface Project {
  id: string;
  name: string;
  description?: string;
  project_path?: string;
  service_mode?: string;
  created_at: string;
  updated_at: string;
  files?: ProjectFile[];
  progress?: ProjectProgress[];
}

export interface ProjectFile {
  name: string;
  size: number;
  extension: string;
  relative_path?: string;
  modified_time: number;
  is_bid_candidate?: boolean;
  is_analysis_report?: boolean;
}

export interface ProjectProgress {
  step_key: StepKey;
  status: StepStatus;
  progress: number;
  started_at?: string;
  completed_at?: string;
  data?: Record<string, any>;
}

// 错误类型
export interface StepApiError {
  code: number;
  message: string;
  details?: string;
  timestamp: string;
  traceId: string;
  stepKey: StepKey;
  projectId: string;
}

// Hook返回类型
export interface UseStepProgressReturn {
  updating: boolean;
  markStepInProgress: (progress?: number, data?: any) => Promise<boolean>;
  markStepCompleted: (data?: any) => Promise<boolean>;
  markStepError: (error: string, data?: any) => Promise<boolean>;
  updateProgress: (progress: number, data?: any) => Promise<boolean>;
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: boolean;
  pollingAttempt: number;
  pollingError: any;
}

export interface UseProjectLoaderReturn {
  projectId: string | undefined;
  project: Project | null;
  isLoading: boolean;
  error: string | null;
}

// 轮询相关类型
export interface PollingState {
  isPolling: boolean;
  attempt: number;
  lastError: any;
  currentInterval: number;
}

export interface PollingOptions {
  initialInterval?: number;
  maxInterval?: number;
  maxRetries?: number;
  backoffMultiplier?: number;
  adaptiveInterval?: boolean;
  fastInitialPolls?: number;
  retryableErrors?: number[];
  onError?: (error: any, attempt: number) => void;
  onMaxRetriesReached?: (error: any) => void;
  onStart?: () => void;
  onStop?: () => void;
  onSuccess?: (data: any) => void;
}

// 组件Props类型
export interface StepPageProps {
  projectId: string;
  project: Project;
}

export interface ErrorHandlerProps {
  error: StepApiError | Error | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  size?: 'small' | 'default' | 'large';
  type?: 'error' | 'warning' | 'info';
}


