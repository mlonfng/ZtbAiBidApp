import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API基础配置 - 注意：这里需要包含 /api 因为axios baseURL会与相对路径组合
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:9958') + '/api';

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config: any) => {
    // 添加认证token
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加请求ID用于追踪
    if (config.headers) {
      config.headers['X-Request-ID'] = Date.now().toString();
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // 统一错误处理 - 符合统一规范v3.md的HTTP状态码规范
    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.message || '请求失败';

      switch (status) {
        case 400:
          // 参数错误 - 缺少必要参数、参数格式错误
          console.error('参数错误:', errorMessage);
          // 可以在这里显示用户友好的错误提示
          break;
        case 401:
          // 未授权，清除token并跳转到登录页
          console.error('未授权访问:', errorMessage);
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          // 禁止访问
          console.error('禁止访问:', errorMessage);
          break;
        case 404:
          // 资源不存在 - 项目不存在、任务不存在
          console.error('资源不存在:', errorMessage);
          break;
        case 409:
          // 冲突 - 已有运行中的任务
          console.warn('操作冲突:', errorMessage);
          // 这种情况通常需要用户确认或等待
          break;
        case 422:
          // 表单验证错误
          console.error('数据验证失败:', errorMessage);
          break;
        case 429:
          // 请求过于频繁
          console.warn('请求过于频繁:', errorMessage);
          break;
        case 500:
          // 内部服务器错误
          console.error('服务器内部错误:', errorMessage);
          break;
        case 502:
          // 上游服务错误 - AI服务不可用、格式化服务不健康
          console.error('上游服务不可用:', errorMessage);
          // 可以提示用户稍后重试
          break;
        default:
          console.error(`未知错误 (${status}):`, errorMessage);
          break;
      }
    } else if (error.request) {
      // 网络错误
      console.error('网络连接失败:', error.request);
    } else {
      // 其他错误
      console.error('请求失败:', error.message);
    }

    return Promise.reject(error);
  }
);

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
}

// 分页响应类型
export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 通用API方法
export const apiClient = {
  // GET请求
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return api.get(url, config).then(response => response.data);
  },

  // POST请求
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return api.post(url, data, config).then(response => response.data);
  },

  // PUT请求
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return api.put(url, data, config).then(response => response.data);
  },

  // PATCH请求
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return api.patch(url, data, config).then(response => response.data);
  },

  // DELETE请求
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return api.delete(url, config).then(response => response.data);
  },

  // 文件上传
  upload: <T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    }).then(response => response.data);
  },

  // 文件下载
  download: (url: string, filename?: string): Promise<void> => {
    return api.get(url, {
      responseType: 'blob',
    }).then(response => {
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    });
  },
};

// 服务模式API
export const serviceAPI = {
  // 获取当前服务模式
  getCurrentServiceMode: async () => {
    try {
      const response = await api.get('/service-mode/current');
      return response.data;
    } catch (error) {
      console.error('获取当前服务模式失败:', error);
      throw error;
    }
  },

  // 设置服务模式
  setServiceMode: async (mode: string, projectId?: string) => {
    try {
      const payload: any = { mode };
      if (projectId) {
        payload.project_id = projectId;
      }
      const response = await api.post('/service-mode/set', payload);
      return response.data;
    } catch (error) {
      console.error('设置服务模式失败:', error);
      throw error;
    }
  },

  // 获取所有可用的服务模式
  getServiceModes: async () => {
    try {
      const response = await api.get('/service-mode/modes');
      return response.data;
    } catch (error) {
      console.error('获取服务模式列表失败:', error);
      throw error;
    }
  },
};

// 招标文件分析API
export const analysisAPI = {
  // 开始分析
  startAnalysis: async (projectId: string, analysisType: string = 'comprehensive') => {
    try {
      const response = await api.post('/analysis/start', {
        project_id: projectId,
        analysis_type: analysisType
      });
      return response.data;
    } catch (error) {
      console.error('开始分析失败:', error);
      throw error;
    }
  },

  // 获取分析状态
  getAnalysisStatus: async (taskId: string) => {
    try {
      const response = await api.get(`/analysis/task/${taskId}/status`);
      return response.data;
    } catch (error) {
      console.error('获取分析状态失败:', error);
      throw error;
    }
  },

  // 获取分析结果
  getAnalysisResult: async (projectId: string) => {
    try {
      const response = await api.get(`/analysis/result/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('获取分析结果失败:', error);
      throw error;
    }
  },

  // 停止分析任务
  stopAnalysis: async (taskId: string) => {
    try {
      const response = await api.post(`/analysis/task/${taskId}/stop`);
      return response.data;
    } catch (error) {
      console.error('停止分析失败:', error);
      throw error;
    }
  },

  // 导出分析报告
  exportAnalysisReport: async (projectId: string) => {
    try {
      const response = await api.post(`/analysis/export/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('导出分析报告失败:', error);
      throw error;
    }
  },
};

// 项目管理API
export const projectAPI = {
  // 获取项目配置
  getProjectConfig: async (projectId: string) => {
    try {
      const response = await api.get(`/projects/${projectId}/config`);
      return response.data;
    } catch (error) {
      console.error('获取项目配置失败:', error);
      throw error;
    }
  },

  // 获取项目文件列表
  getProjectFiles: async (projectId: string) => {
    try {
      const response = await api.get(`/projects/${projectId}/files`);
      return response.data;
    } catch (error) {
      console.error('获取项目文件列表失败:', error);
      throw error;
    }
  },

  // 获取文件内容
  getFileContent: async (projectId: string, filename: string) => {
    try {
      const response = await api.get(`/projects/${projectId}/files/${encodeURIComponent(filename)}`);
      return response.data;
    } catch (error) {
      console.error('获取文件内容失败:', error);
      throw error;
    }
  },

  // 获取分析状态
  getAnalysisStatus: async (projectId: string) => {
    try {
      const response = await api.get(`/projects/${projectId}/analysis-status`);
      return response.data;
    } catch (error) {
      console.error('获取分析状态失败:', error);
      throw error;
    }
  },
};

// 文件格式化API
export const formattingAPI = {
  // 检测文件格式
  detectFormat: async (projectId: string) => {
    try {
      const response = await api.post('/formatting/format', {
        project_id: projectId,
        output_format: 'detect',
        include_images: true,
        preserve_layout: true
      });
      return response.data;
    } catch (error) {
      console.error('检测文件格式失败:', error);
      throw error;
    }
  },

  // 转换文件格式
  convertFormat: async (projectId: string, targetFormat: string = 'html') => {
    try {
      const response = await api.post('/formatting/format', {
        project_id: projectId,
        output_format: 'convert',
        target_format: targetFormat,
        include_images: true,
        preserve_layout: true
      });
      return response.data;
    } catch (error) {
      console.error('转换文件格式失败:', error);
      throw error;
    }
  },

  // 提取文件内容
  extractContent: async (projectId: string, source_relative_path?: string) => {
    try {
      const response = await api.post('/formatting/format', {
        project_id: projectId,
        output_format: 'extract',
        include_images: true,
        preserve_layout: true,
        ...(source_relative_path ? { source_relative_path } : {})
      });
      return response.data;
    } catch (error) {
      console.error('提取文件内容失败:', error);
      throw error;
    }
  },

  // 生成HTML
  generateHTML: async (projectId: string, includeImages: boolean = true, preserveLayout: boolean = true, source_relative_path?: string) => {
    try {
      const response = await api.post('/formatting/format', {
        project_id: projectId,
        output_format: 'html',
        include_images: includeImages,
        preserve_layout: preserveLayout,
        ...(source_relative_path ? { source_relative_path } : {})
      });
      return response.data;
    } catch (error) {
      console.error('生成HTML失败:', error);
      throw error;
    }
  },

  // 验证文件格式
  validateFormat: async (projectId: string, source_relative_path?: string) => {
    try {
      const response = await api.post('/formatting/format', {
        project_id: projectId,
        output_format: 'validate',
        include_images: true,
        preserve_layout: true,
        ...(source_relative_path ? { source_relative_path } : {})
      });
      return response.data;
    } catch (error) {
      console.error('验证文件格式失败:', error);
      throw error;
    }
  },

  // 清理文件格式
  cleanFormat: async (projectId: string, source_relative_path?: string) => {
    try {
      const response = await api.post('/formatting/format', {
        project_id: projectId,
        output_format: 'clean',
        include_images: true,
        preserve_layout: true,
        ...(source_relative_path ? { source_relative_path } : {})
      });
      return response.data;
    } catch (error) {
      console.error('清理文件格式失败:', error);
      throw error;
    }
  },

  // 预览文档
  previewDocument: async (projectId: string) => {
    try {
      const response = await api.get(`/formatting/preview/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('预览文档失败:', error);
      throw error;
    }
  },

  // 下载格式化文件
  downloadFormatted: async (projectId: string) => {
    try {
      const response = await api.get(`/formatting/download/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('下载格式化文件失败:', error);
      throw error;
    }
  },
};

// 资料管理API
export const materialAPI = {
  // 分析资料需求
  analyzeRequirements: async (projectId: string, analysisType: string = 'auto') => {
    try {
      const response = await api.post('/materials/analyze-requirements', {
        project_id: projectId,
        analysis_type: analysisType
      });
      return response.data;
    } catch (error) {
      console.error('分析资料需求失败:', error);
      throw error;
    }
  },

  // 获取资料分类
  getCategories: async () => {
    try {
      const response = await api.get('/materials/categories');
      return response.data;
    } catch (error) {
      console.error('获取资料分类失败:', error);
      throw error;
    }
  },

  // 上传资料文件
  uploadMaterial: async (projectId: string, categoryId: string, itemId: string, file: File, description?: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', projectId);
      formData.append('category_id', categoryId);
      formData.append('item_id', itemId);
      if (description) {
        formData.append('description', description);
      }

      const response = await api.post('/material/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('上传资料文件失败:', error);
      throw error;
    }
  },

  // 获取资料列表
  getMaterialList: async (projectId: string) => {
    try {
      const response = await api.get(`/materials/list/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('获取资料列表失败:', error);
      throw error;
    }
  },

  // 删除资料
  deleteMaterial: async (materialId: string) => {
    try {
      const response = await api.delete('/materials/delete', {
        data: { material_id: materialId }
      });
      return response.data;
    } catch (error) {
      console.error('删除资料失败:', error);
      throw error;
    }
  },

  // 导出资料管理报告
  exportReport: async (projectId: string) => {
    try {
      const response = await api.post(`/materials/export-report/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('导出资料管理报告失败:', error);
      throw error;
    }
  },

  // 获取单个资料详情
  getMaterial: async (materialId: string) => {
    try {
      const response = await api.get(`/material/${materialId}`);
      return response.data;
    } catch (error) {
      console.error('获取资料详情失败:', error);
      throw error;
    }
  },
};

// 文档导出API
export const exportAPI = {
  // 开始导出任务
  startExport: async (projectId: string, exportConfig: any) => {
    try {
      const response = await api.post('/export/start', {
        project_id: projectId,
        export_config: exportConfig
      });
      return response.data;
    } catch (error) {
      console.error('开始导出失败:', error);
      throw error;
    }
  },

  // 导出DOCX
  exportDocx: async (projectId: string, config: any = {}) => {
    try {
      const exportConfig = {
        export_format: 'docx',
        ...config
      };
      return await exportAPI.startExport(projectId, exportConfig);
    } catch (error) {
      console.error('导出DOCX失败:', error);
      throw error;
    }
  },

  // 导出PDF
  exportPdf: async (projectId: string, config: any = {}) => {
    try {
      const exportConfig = {
        export_format: 'pdf',
        ...config
      };
      return await exportAPI.startExport(projectId, exportConfig);
    } catch (error) {
      console.error('导出PDF失败:', error);
      throw error;
    }
  },

  // 导出HTML
  exportHtml: async (projectId: string, config: any = {}) => {
    try {
      const exportConfig = {
        export_format: 'html',
        ...config
      };
      return await exportAPI.startExport(projectId, exportConfig);
    } catch (error) {
      console.error('导出HTML失败:', error);
      throw error;
    }
  },

  // 批量导出
  batchExport: async (projectId: string, config: any = {}) => {
    try {
      const exportConfig = {
        export_format: 'all',
        ...config
      };
      return await exportAPI.startExport(projectId, exportConfig);
    } catch (error) {
      console.error('批量导出失败:', error);
      throw error;
    }
  },

  // 获取导出状态
  getExportStatus: async (taskId: string) => {
    try {
      const response = await api.get(`/export/task/${taskId}/status`);
      return response.data;
    } catch (error) {
      console.error('获取导出状态失败:', error);
      throw error;
    }
  },

  // 下载导出文件
  downloadExport: async (projectId: string, taskId: string) => {
    try {
      const response = await api.post('/export/download', {
        project_id: projectId,
        task_id: taskId
      });
      return response.data;
    } catch (error) {
      console.error('下载导出文件失败:', error);
      throw error;
    }
  },

  // 获取导出历史
  getExportHistory: async (projectId: string) => {
    try {
      const response = await api.get(`/export/history/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('获取导出历史失败:', error);
      throw error;
    }
  },
};

// 框架生成API
export const frameworkAPI = {
  // 生成框架
  generateFramework: async (projectId: string, frameworkType: string = 'standard', templateId?: string, autoGenerate: boolean = false) => {
    try {
      const response = await api.post('/framework/generate', {
        project_id: projectId,
        framework_type: frameworkType,
        template_id: templateId,
        auto_generate: autoGenerate
      });
      return response.data;
    } catch (error) {
      console.error('生成框架失败:', error);
      throw error;
    }
  },

  // 获取框架模板
  getTemplates: async () => {
    try {
      const response = await api.get('/framework/templates');
      return response.data;
    } catch (error) {
      console.error('获取框架模板失败:', error);
      throw error;
    }
  },

  // 保存框架
  saveFramework: async (projectId: string, frameworkData: any) => {
    try {
      const response = await api.post('/framework/save', {
        project_id: projectId,
        framework_data: frameworkData
      });
      return response.data;
    } catch (error) {
      console.error('保存框架失败:', error);
      throw error;
    }
  },

  // 加载框架
  loadFramework: async (projectId: string) => {
    try {
      const response = await api.get(`/framework/load/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('加载框架失败:', error);
      throw error;
    }
  },

  // 验证框架
  validateFramework: async (frameworkData: any) => {
    try {
      const response = await api.post('/framework/validate', {
        framework_data: frameworkData
      });
      return response.data;
    } catch (error) {
      console.error('验证框架失败:', error);
      throw error;
    }
  },

  // 导出框架
  exportFramework: async (projectId: string, exportFormat: string = 'docx', frameworkData?: any) => {
    try {
      const response = await api.post('/framework/export', {
        project_id: projectId,
        export_format: exportFormat,
        framework_data: frameworkData
      });
      return response.data;
    } catch (error) {
      console.error('导出框架失败:', error);
      throw error;
    }
  },

  // 获取框架历史
  getFrameworkHistory: async (projectId: string) => {
    try {
      const response = await api.get(`/framework/history/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('获取框架历史失败:', error);
      throw error;
    }
  },
};

// AI Health API
export const aiAPI = {
  getHealth: async () => {
    const res = await api.get('/ai/health');
    return res.data;
  }
};



// 导入统一Step API客户端
export {
  stepAPI,
  serviceStepAPI,
  bidStepAPI,
  formattingStepAPI,
  materialStepAPI,
  frameworkStepAPI,
  contentStepAPI,
  formatConfigStepAPI,
  exportStepAPI
} from './stepAPI';









// 导出axios实例供特殊用途
export { api };
export default apiClient;
