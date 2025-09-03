import apiClient, { PaginatedResponse, ApiResponse } from './api';
import { Project, ProjectPage } from '../store/slices/projectSlice';



export interface CreateProjectRequest {
  name: string;
  description?: string;
  templateId?: string;
  frameworkId?: string;
}

export interface CreateProjectWithFileRequest {
  bidFile: File;
  projectName: string;
  userPhone: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: 'draft' | 'in_progress' | 'completed' | 'archived' | 'active' | null;
  settings?: any;
}

export interface CreatePageRequest {
  title: string;
  layoutType: string;
  templateId?: string;
  order?: number;
}

export interface UpdatePageRequest {
  title?: string;
  layoutType?: string;
  components?: any[];
  settings?: any;
  order?: number;
}

export interface ValidateBidFileRequest {
  file: File;
  userPhone?: string;
}

export interface ProjectSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  author?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ComponentData {
  id?: string;
  type: string;
  title: string;
  content: any;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style?: any;
  properties?: any;
}

export const projectAPI = {
  // 获取项目列表
  getProjects: (params: ProjectSearchParams = {}): Promise<PaginatedResponse<Project>> => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [DEBUG] projectAPI.getProjects called with params:', params);
    }
    return apiClient.get('/projects/', { params })
      .then(response => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 [DEBUG] projectAPI.getProjects response:', response);
        }
        return response.data || response;
      })
      .catch(error => {
        if (process.env.NODE_ENV === 'development') {
          console.error('🔍 [DEBUG] projectAPI.getProjects error:', error);
          console.error('🔍 [DEBUG] Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: error.config
          });
        }
        throw error;
      });
  },

  // 获取单个项目
  getProject: (id: string): Promise<Project> => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [DEBUG] projectAPI.getProject called with id:', id);
    }
    return apiClient.get(`/project/${id}`)
      .then(response => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 [DEBUG] projectAPI.getProject response:', response);
        }

        // 后端返回格式: { success: true, data: {...}, message: "..." }
        // 注意：apiClient.get() 已经返回了 response.data，所以这里的 response 就是后端的JSON对象
        if (response.success && response.data) {
          const projectData = response.data;
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [DEBUG] projectAPI.getProject extracted data:', projectData);
          }

          // 确保数据格式符合前端Project接口
          const project: Project = {
            id: String(projectData.id), // 确保ID是字符串
            name: projectData.name || '',
            description: projectData.description || '',
            status: projectData.status || 'draft',
            created_at: projectData.created_at || projectData.createdTime,
            updated_at: projectData.updated_at || projectData.updatedTime,
            bid_file_name: projectData.bid_file_name || '',
            user_phone: projectData.user_phone || '',
            service_mode: projectData.service_mode || '',
            project_path: projectData.project_path || '',
            // 添加前端需要的字段
            author: projectData.user_phone || '',
            collaborators: projectData.collaborators || [],
            pages: projectData.pages || [],
            settings: projectData.settings || {}
          };

          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [DEBUG] projectAPI.getProject final project:', project);
          }
          return project;
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.error('🔍 [DEBUG] projectAPI.getProject invalid response format:', response);
          }
          throw new Error('项目数据格式错误');
        }
      })
      .catch(error => {
        if (process.env.NODE_ENV === 'development') {
          console.error('🔍 [DEBUG] projectAPI.getProject error:', error);
          console.error('🔍 [DEBUG] Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: error.config
          });
        }
        throw error;
      });
  },

  // 创建项目
  createProject: (data: CreateProjectRequest): Promise<Project> => {
    return apiClient.post<Project>('/projects', data)
      .then(response => response.data);
  },

  // 验证招标文件
  validateBidFile: (file: File, userPhone?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    if (userPhone) {
      formData.append('user_phone', userPhone);
    }

    return apiClient.post('/validation/bid-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 增加到2分钟超时，因为AI验证需要更长时间
    }).then(response => {
      console.log('🔍 [DEBUG] API原始响应:', response);
      // 注意：apiClient.post() 已经返回了 response.data，所以这里的 response 就是后端的JSON对象
      console.log('🔍 [DEBUG] API响应数据:', response);

      // 检查响应数据结构
      if (response && typeof response === 'object') {
        // 如果响应已经包含 success, message, data 结构，直接返回
        if ('success' in response && 'message' in response && 'data' in response) {
          console.log('✅ [DEBUG] 响应包含完整结构，直接返回');
          return response;
        } else {
          // 如果响应是直接的验证结果，需要包装
          console.log('🔧 [DEBUG] 响应需要包装，创建标准结构');
          console.log('🔧 [DEBUG] 原始响应数据:', response);

          // 检查多种可能的成功标识
          const isSuccess = (response as any).is_valid_bid_file === true ||
                           (response as any).success === true ||
                           (response as any).valid === true ||
                           ((response as any).message && (response as any).message.includes('通过'));

          return {
            success: isSuccess,
            message: isSuccess ? '文件验证通过' : ((response as any).message || '文件验证失败'),
            data: response
          };
        }
      } else {
        console.error('❌ [DEBUG] 响应数据格式异常:', response);
        return {
          success: false,
          message: '响应数据格式异常',
          data: {}
        };
      }
    });
  },

  // 通过文件创建项目
    createProjectWithFile: (data: CreateProjectWithFileRequest): Promise<ApiResponse<Project>> => {
    const formData = new FormData();
    formData.append('bid_file', data.bidFile);
    formData.append('project_name', data.projectName);
    formData.append('user_phone', data.userPhone);

    return apiClient.post<Project>('/project/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 更新项目
  updateProject: (id: string, data: UpdateProjectRequest): Promise<Project> => {
    return apiClient.patch<Project>(`/projects/${id}`, data)
      .then(response => response.data);
  },

  // 删除项目
  deleteProject: (id: string): Promise<void> => {
    return apiClient.delete(`/project/${id}`).then(() => {});
  },

  // 复制项目
  duplicateProject: (id: string, name?: string): Promise<Project> => {
    return apiClient.post<Project>(`/projects/${id}/duplicate`, { name })
      .then(response => response.data);
  },

  // 导出项目
  exportProject: (id: string, format: 'json' | 'pdf' | 'docx' | 'html'): Promise<void> => {
    return apiClient.download(`/projects/${id}/export?format=${format}`, `project_${id}.${format}`);
  },

  // 获取项目页面列表
  getPages: (projectId: string): Promise<ProjectPage[]> => {
    return apiClient.get<ProjectPage[]>(`/projects/${projectId}/pages`)
      .then(response => response.data);
  },

  // 获取单个页面
  getPage: (projectId: string, pageId: string): Promise<ProjectPage> => {
    return apiClient.get<ProjectPage>(`/projects/${projectId}/pages/${pageId}`)
      .then(response => response.data);
  },

  // 添加页面
  addPage: (projectId: string, data: CreatePageRequest): Promise<ProjectPage> => {
    return apiClient.post<ProjectPage>(`/projects/${projectId}/pages`, data)
      .then(response => response.data);
  },

  // 更新页面
  updatePage: (projectId: string, pageId: string, data: UpdatePageRequest): Promise<ProjectPage> => {
    return apiClient.patch<ProjectPage>(`/projects/${projectId}/pages/${pageId}`, data)
      .then(response => response.data);
  },

  // 删除页面
  deletePage: (projectId: string, pageId: string): Promise<void> => {
    return apiClient.delete(`/projects/${projectId}/pages/${pageId}`).then(() => {});
  },

  // 复制页面
  duplicatePage: (projectId: string, pageId: string): Promise<ProjectPage> => {
    return apiClient.post<ProjectPage>(`/projects/${projectId}/pages/${pageId}/duplicate`)
      .then(response => response.data);
  },

  // 重新排序页面
  reorderPages: (projectId: string, pageIds: string[]): Promise<void> => {
    return apiClient.post(`/projects/${projectId}/pages/reorder`, { pageIds }).then(() => {});
  },

  // 添加组件
  addComponent: (projectId: string, pageId: string, component: ComponentData): Promise<any> => {
    return apiClient.post(`/projects/${projectId}/pages/${pageId}/components`, component)
      .then(response => response.data);
  },

  // 更新组件
  updateComponent: (projectId: string, pageId: string, componentId: string, data: Partial<ComponentData>): Promise<any> => {
    return apiClient.patch(`/projects/${projectId}/pages/${pageId}/components/${componentId}`, data)
      .then(response => response.data);
  },

  // 删除组件
  deleteComponent: (projectId: string, pageId: string, componentId: string): Promise<void> => {
    return apiClient.delete(`/projects/${projectId}/pages/${pageId}/components/${componentId}`).then(() => {});
  },

  // 复制组件
  duplicateComponent: (projectId: string, pageId: string, componentId: string): Promise<any> => {
    return apiClient.post(`/projects/${projectId}/pages/${pageId}/components/${componentId}/duplicate`)
      .then(response => response.data);
  },

  // 移动组件
  moveComponent: (projectId: string, pageId: string, componentId: string, position: any): Promise<any> => {
    return apiClient.patch(`/projects/${projectId}/pages/${pageId}/components/${componentId}/position`, { position })
      .then(response => response.data);
  },

  // 获取项目统计
  getProjectStats: (id: string): Promise<any> => {
    return apiClient.get(`/projects/${id}/stats`)
      .then(response => response.data);
  },

  // 生成预览
  generatePreview: (projectId: string, pageId?: string): Promise<any> => {
    const url = pageId ? `/projects/${projectId}/pages/${pageId}/preview` : `/projects/${projectId}/preview`;
    return apiClient.get(url)
      .then(response => response.data);
  },

  // 保存为模板
  saveAsTemplate: (projectId: string, templateData: any): Promise<any> => {
    return apiClient.post(`/projects/${projectId}/save-as-template`, templateData)
      .then(response => response.data);
  },

  // 获取项目进展 - 符合统一规范v3
  getProjectProgress: (projectId: string): Promise<any> => {
    return apiClient.get(`/projects/${projectId}/progress`)
      .then(response => response); // 返回完整响应体以匹配thunk中的逻辑
  },

  // 更新步骤进展 - 符合统一规范v3
  updateStepProgress: (projectId: string, stepKey: string, data: { status?: string; progress?: number; data?: any }): Promise<any> => {
    return apiClient.post(`/projects/${projectId}/progress/update`, {
      step_key: stepKey,
      step_name: stepKey, // 保持与旧实现一致
      ...data
    }).then(response => response); // 返回完整响应体
  },
};
