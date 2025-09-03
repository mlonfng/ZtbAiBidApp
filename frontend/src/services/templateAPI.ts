import apiClient, { PaginatedResponse } from './api';
import { Template } from '../store/slices/templateSlice';

export interface TemplateSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  category?: string;
  status?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateTemplateRequest {
  name: string;
  description: string;
  type: string;
  category: string;
  tags?: string[];
  templateFile: File;
  previewImage?: File;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  category?: string;
  status?: string;
  tags?: string[];
  templateFile?: File;
  previewImage?: File;
}

export const templateAPI = {
  // 获取模板列表
  getTemplates: (params: TemplateSearchParams = {}): Promise<PaginatedResponse<Template>> => {
    return apiClient.get('/templates', { params })
      .then(response => response.data);
  },

  // 获取单个模板
  getTemplate: (id: string): Promise<Template> => {
    return apiClient.get<Template>(`/templates/${id}`)
      .then(response => response.data);
  },

  // 创建模板
  createTemplate: (data: CreateTemplateRequest): Promise<Template> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('type', data.type);
    formData.append('category', data.category);
    if (data.tags) {
      formData.append('tags', JSON.stringify(data.tags));
    }
    formData.append('templateFile', data.templateFile);
    if (data.previewImage) {
      formData.append('previewImage', data.previewImage);
    }

    return apiClient.post<Template>('/templates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(response => response.data);
  },

  // 更新模板
  updateTemplate: (id: string, data: UpdateTemplateRequest): Promise<Template> => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.category) formData.append('category', data.category);
    if (data.status) formData.append('status', data.status);
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    if (data.templateFile) formData.append('templateFile', data.templateFile);
    if (data.previewImage) formData.append('previewImage', data.previewImage);

    return apiClient.patch<Template>(`/templates/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(response => response.data);
  },

  // 删除模板
  deleteTemplate: (id: string): Promise<void> => {
    return apiClient.delete(`/templates/${id}`).then(() => {});
  },

  // 下载模板
  downloadTemplate: (id: string): Promise<void> => {
    return apiClient.download(`/templates/${id}/download`, `template_${id}.zip`);
  },

  // 获取模板内容
  getTemplateContent: (id: string, version?: string): Promise<any> => {
    const params = version ? { version } : {};
    return apiClient.get(`/templates/${id}/content`, { params })
      .then(response => response.data);
  },

  // 评分模板
  rateTemplate: (id: string, rating: number, comment?: string): Promise<any> => {
    return apiClient.post(`/templates/${id}/rate`, { rating, comment })
      .then(response => response.data);
  },

  // 获取模板评分
  getTemplateRatings: (id: string): Promise<any[]> => {
    return apiClient.get(`/templates/${id}/ratings`)
      .then(response => response.data);
  },

  // 获取模板版本
  getTemplateVersions: (id: string): Promise<any[]> => {
    return apiClient.get(`/templates/${id}/versions`)
      .then(response => response.data);
  },

  // 获取热门模板
  getPopularTemplates: (limit: number = 10, category?: string): Promise<Template[]> => {
    const params = { limit, category };
    return apiClient.get('/templates/popular', { params })
      .then(response => response.data);
  },

  // 获取最新模板
  getRecentTemplates: (limit: number = 10, category?: string): Promise<Template[]> => {
    const params = { limit, category };
    return apiClient.get('/templates/recent', { params })
      .then(response => response.data);
  },

  // 获取模板分类
  getTemplateCategories: (): Promise<any[]> => {
    return apiClient.get('/templates/categories')
      .then(response => response.data);
  },

  // 获取模板标签
  getTemplateTags: (): Promise<string[]> => {
    return apiClient.get('/templates/tags')
      .then(response => response.data);
  },

  // 获取模板统计
  getTemplateStats: (): Promise<any> => {
    return apiClient.get('/templates/stats')
      .then(response => response.data);
  },

  // 导入模板
  importTemplate: (file: File): Promise<Template> => {
    return apiClient.upload<Template>('/templates/import', file)
      .then(response => response.data);
  },

  // 导出模板
  exportTemplate: (id: string, includeVersions: boolean = false): Promise<void> => {
    // const params = { includeVersions };
    return apiClient.download(`/templates/${id}/export`, `template_${id}.zip`);
  },

  // 应用模板到项目
  applyTemplate: (templateId: string, projectId: string, pageId?: string): Promise<any> => {
    const data = { templateId, projectId, pageId };
    return apiClient.post('/templates/apply', data)
      .then(response => response.data);
  },

  // 预览模板
  previewTemplate: (id: string): Promise<any> => {
    return apiClient.get(`/templates/${id}/preview`)
      .then(response => response.data);
  },
};
