import { apiClient } from './api';
import { handleStepApiError, createRetryHandler } from '../utils/errorHandler';

/**
 * 统一Step API客户端
 * 符合统一规范v3.md的Step API规范
 */

export interface StepApiResponse<T = any> {
  success: boolean;
  message?: string; // 前端容忍后端未返回 message 的情况，保持向后兼容
  data: T;
  code?: number; // 前端容忍后端未返回 code 的情况，保持向后兼容
}

export interface StepStatus {
  project_id: string;
  step_key: string;
  status: 'pending' | 'in_progress' | 'running' | 'completed' | 'error' | 'cancelled';
  progress: number;
  started_at?: string;
  completed_at?: string;
  updated_at?: string;
  message?: string;
}

export interface StepExecuteOptions {
  [key: string]: any;
}

/**
 * 统一Step API客户端类
 */
export class StepAPIClient {
  constructor() {}

  /**
   * 获取步骤状态
   */
  async getStatus(projectId: string, stepKey: string): Promise<StepApiResponse<StepStatus>> {
    const url = `/projects/${projectId}/step/${stepKey}/status`;
    
    try {
      const response = await apiClient.get<StepStatus>(url);
      const normalized: StepApiResponse<StepStatus> = {
        success: response.success,
        data: response.data,
        message: response.message,
        code: (response as any).code ?? undefined,
      };
      // 状态规范化：兼容后端可能返回的 "running"，统一转为 "in_progress"
      if ((normalized.data as any)?.status === 'running') {
        (normalized.data as any).status = 'in_progress';
      }
      return normalized;
    } catch (error) {
      const apiError = handleStepApiError(error, stepKey, 'status', { showMessage: false });
      throw apiError;
    }
  }

  /**
   * 执行步骤操作
   */
  async execute(
    projectId: string, 
    stepKey: string, 
    options: StepExecuteOptions = {}
  ): Promise<StepApiResponse<any>> {
    const url = `/projects/${projectId}/step/${stepKey}/execute`;
    
    try {
      const response = await apiClient.post<any>(url, options, {
        headers: {
          'Idempotency-Key': `${projectId}-${stepKey}-${Date.now()}`,
          'X-Trace-Id': `${projectId}-${stepKey}-execute-${Date.now()}`,
        }
      });
      const normalized: StepApiResponse<any> = {
        success: response.success,
        data: response.data,
        message: response.message,
        code: (response as any).code ?? undefined,
      };
      return normalized;
    } catch (error) {
      const apiError = handleStepApiError(error, stepKey, 'execute', { showMessage: false });
      throw apiError;
    }
  }

  /**
   * 获取步骤结果
   */
  async getResult(projectId: string, stepKey: string): Promise<StepApiResponse<any>> {
    const url = `/projects/${projectId}/step/${stepKey}/result`;
    
    try {
      const response = await apiClient.get<any>(url);
      const normalized: StepApiResponse<any> = {
        success: response.success,
        data: response.data,
        message: response.message,
        code: (response as any).code ?? undefined,
      };
      return normalized;
    } catch (error) {
      const apiError = handleStepApiError(error, stepKey, 'result', { showMessage: false });
      throw apiError;
    }
  }

  /**
   * 带重试的执行操作
   */
  async executeWithRetry(
    projectId: string,
    stepKey: string,
    options: StepExecuteOptions = {},
    maxRetries: number = 3
  ): Promise<StepApiResponse<any>> {
    const retryHandler = createRetryHandler(
      () => this.execute(projectId, stepKey, options),
      maxRetries
    );
    
    return retryHandler();
  }

  /**
   * 轮询步骤状态直到完成
   */
  async pollUntilComplete(
    projectId: string,
    stepKey: string,
    onProgress?: (status: StepStatus) => void,
    maxPolls: number = 300,
    pollInterval: number = 2000
  ): Promise<StepStatus> {
    let polls = 0;
    
    while (polls < maxPolls) {
      try {
        const response = await this.getStatus(projectId, stepKey);
        
        if (response.success && response.data) {
          const status = response.data;
          
          if (onProgress) {
            onProgress(status);
          }
          
          if (status.status === 'completed' || status.status === 'error' || status.status === 'cancelled') {
            return status;
          }
        }
        
        polls++;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.warn(`轮询步骤状态失败 (${polls}/${maxPolls}):`, error);
        polls++;
        
        if (polls >= maxPolls) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    throw new Error(`轮询超时：步骤 ${stepKey} 在 ${maxPolls} 次轮询后仍未完成`);
  }

  /**
   * 执行并等待完成
   */
  async executeAndWait(
    projectId: string,
    stepKey: string,
    options: StepExecuteOptions = {},
    onProgress?: (status: StepStatus) => void
  ): Promise<{ executeResponse: StepApiResponse<any>; finalStatus: StepStatus; result?: any }> {
    // 执行步骤
    const executeResponse = await this.execute(projectId, stepKey, options);
    
    // 轮询直到完成
    const finalStatus = await this.pollUntilComplete(projectId, stepKey, onProgress);
    
    // 获取结果
    let result;
    if (finalStatus.status === 'completed') {
      try {
        const resultResponse = await this.getResult(projectId, stepKey);
        result = resultResponse.data;
      } catch (error) {
        console.warn('获取步骤结果失败:', error);
      }
    }
    
    return {
      executeResponse,
      finalStatus,
      result
    };
  }
}

// 创建默认实例
export const stepAPI = new StepAPIClient();

// 各步骤的专用API客户端
export const serviceStepAPI = {
  getStatus: (projectId: string) => stepAPI.getStatus(projectId, 'service-mode'),
  execute: (projectId: string, mode: string) => 
    stepAPI.execute(projectId, 'service-mode', { mode }),
  getResult: (projectId: string) => stepAPI.getResult(projectId, 'service-mode'),
};

export const bidStepAPI = {
  getStatus: (projectId: string) => stepAPI.getStatus(projectId, 'bid-analysis'),
  execute: (projectId: string, analysisType: string = 'comprehensive') => 
    stepAPI.execute(projectId, 'bid-analysis', { analysis_type: analysisType }),
  getResult: (projectId: string) => stepAPI.getResult(projectId, 'bid-analysis'),
  executeAndWait: (projectId: string, analysisType: string = 'comprehensive', onProgress?: (status: StepStatus) => void) =>
    stepAPI.executeAndWait(projectId, 'bid-analysis', { analysis_type: analysisType }, onProgress),
};

export const formattingStepAPI = {
  getStatus: (projectId: string) => stepAPI.getStatus(projectId, 'file-formatting'),
  execute: (projectId: string, sequence?: string[], sourceRelativePath?: string) => {
    const options: any = {};
    if (sequence) options.sequence = sequence;
    if (sourceRelativePath) options.source_relative_path = sourceRelativePath;
    return stepAPI.execute(projectId, 'file-formatting', options);
  },
  getResult: (projectId: string) => stepAPI.getResult(projectId, 'file-formatting'),
  executeAndWait: (projectId: string, sequence?: string[], sourceRelativePath?: string, onProgress?: (status: StepStatus) => void) => {
    const options: any = {};
    if (sequence) options.sequence = sequence;
    if (sourceRelativePath) options.source_relative_path = sourceRelativePath;
    return stepAPI.executeAndWait(projectId, 'file-formatting', options, onProgress);
  },
};

export const materialStepAPI = {
  getStatus: (projectId: string) => stepAPI.getStatus(projectId, 'material-management'),
  execute: (projectId: string, payload: any = {}) => 
    stepAPI.execute(projectId, 'material-management', payload),
  getResult: (projectId: string) => stepAPI.getResult(projectId, 'material-management'),
};

export const frameworkStepAPI = {
  getStatus: (projectId: string) => stepAPI.getStatus(projectId, 'framework-generation'),
  execute: (projectId: string, frameworkType: string = 'standard', templateId?: string) => {
    const options: any = { framework_type: frameworkType };
    if (templateId) options.template_id = templateId;
    return stepAPI.execute(projectId, 'framework-generation', options);
  },
  getResult: (projectId: string) => stepAPI.getResult(projectId, 'framework-generation'),
  executeAndWait: (projectId: string, frameworkType: string = 'standard', templateId?: string, onProgress?: (status: StepStatus) => void) => {
    const options: any = { framework_type: frameworkType };
    if (templateId) options.template_id = templateId;
    return stepAPI.executeAndWait(projectId, 'framework-generation', options, onProgress);
  },
};

export const contentStepAPI = {
  getStatus: (projectId: string) => stepAPI.getStatus(projectId, 'content-generation'),
  execute: (projectId: string, sections: string[] = []) => 
    stepAPI.execute(projectId, 'content-generation', { sections }),
  getResult: (projectId: string) => stepAPI.getResult(projectId, 'content-generation'),
  executeAndWait: (projectId: string, sections: string[] = [], onProgress?: (status: StepStatus) => void) =>
    stepAPI.executeAndWait(projectId, 'content-generation', { sections }, onProgress),
};

export const formatConfigStepAPI = {
  getStatus: (projectId: string) => stepAPI.getStatus(projectId, 'format-config'),
  execute: (projectId: string, payload: any = {}) => 
    stepAPI.execute(projectId, 'format-config', payload),
  getResult: (projectId: string) => stepAPI.getResult(projectId, 'format-config'),
};

export const exportStepAPI = {
  getStatus: (projectId: string) => stepAPI.getStatus(projectId, 'document-export'),
  execute: (projectId: string, exportFormat: string = 'docx', config: any = {}) => 
    stepAPI.execute(projectId, 'document-export', { export_format: exportFormat, ...config }),
  getResult: (projectId: string) => stepAPI.getResult(projectId, 'document-export'),
  executeAndWait: (projectId: string, exportFormat: string = 'docx', config: any = {}, onProgress?: (status: StepStatus) => void) =>
    stepAPI.executeAndWait(projectId, 'document-export', { export_format: exportFormat, ...config }, onProgress),
};

export default stepAPI;
