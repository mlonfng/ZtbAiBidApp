import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { projectAPI, CreateProjectRequest, CreatePageRequest, CreateProjectWithFileRequest } from '../../services/projectAPI';
import { Project as BaseProject, ProjectProgress as BaseProjectProgress, StepStatus, StepKey } from '../../types/stepTypes';
import { setGlobalLoading } from './uiSlice';

export interface ProjectStep {
  step_key: StepKey;
  step_name: string;
  status: StepStatus | 'skipped';
  progress: number;
  started_at?: string;
  completed_at?: string;
  data?: any;
}

export interface ProjectProgress {
  project_id: string;
  current_step: string;
  next_step?: string;
  total_progress: number;
  project_status: string;
  steps: ProjectStep[];
  progress_data?: any;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'archived' | 'active' | null;
  created_at: string;
  updated_at?: string;
  bid_file_name?: string;
  bid_document_name?: string;
  user_phone?: string;
  service_mode?: string;
  project_path?: string;
  current_step?: string;
  progress?: ProjectProgress;
  files?: any[];
  // 兼容字段
  createdTime?: string;
  updatedTime?: string;
  author?: string;
  collaborators?: string[];
  framework?: any;
  pages?: any[];
  settings?: any;
}

export interface ProjectPage {
  id: string;
  title: string;
  layoutType: string;
  components: any[];
  order: number;
  settings: any;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  currentPage: ProjectPage | null;
  loading: boolean;
  error: string | null;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  currentPage: null,
  loading: false,
  error: null,
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0,
  },
};

// 异步actions
export const fetchProjects = createAsyncThunk(
  'project/fetchProjects',
  async (params: { page?: number; pageSize?: number; search?: string }) => {
    try {
      const response = await projectAPI.getProjects(params);
      return response;
    } catch (error) {
      // 只在开发环境且明确启用模拟数据时使用模拟数据
      const enableMockData = process.env.NODE_ENV === 'development' &&
                            process.env.REACT_APP_ENABLE_MOCK_DATA === 'true';

      if (enableMockData) {
        console.warn('⚠️ 使用模拟数据 - API调用失败，已启用开发模式模拟数据');
        const mockData = {
          success: true,
          data: {
            projects: [
              {
                id: "1",
                name: "汾西县购置档案整理服务及设备配置项目_定稿_20250727_140248",
                description: "档案整理服务项目",
                status: "active",
                created_at: "2025-07-27T14:02:48Z",
                updated_at: "2025-07-27T14:02:48Z",
                bid_file_name: "汾西县购置档案整理服务及设备配置项目(定稿).pdf",
                user_phone: "13800138000",
                service_mode: "ai_assisted"
              }
            ],
            pagination: {
              current: 1,
              pageSize: 10,
              total: 1,
              totalPages: 1
            }
          },
          message: "获取项目列表成功 (开发模式模拟数据)"
        };
        return mockData.data;
      }

      // 生产环境或未启用模拟数据时，直接抛出错误
      throw error;
    }
  }
);

export const createProject = createAsyncThunk(
  'project/createProject',
  async (projectData: CreateProjectRequest) => {
    const response = await projectAPI.createProject(projectData);
    return response;
  }
);

export const createProjectWithFile = createAsyncThunk(
  'project/createProjectWithFile',
  async (projectData: CreateProjectWithFileRequest, { dispatch }) => {
    const response = await projectAPI.createProjectWithFile(projectData);
    if (response.success && response.data) {
      // 将返回的数据设置为当前项目
      dispatch(setCurrentProject(response.data));
      return response.data; // 返回项目数据
    }
    // 处理API返回的错误情况
    throw new Error(response.message || '创建项目失败');
  }
);

export const updateProject = createAsyncThunk(
  'project/updateProject',
  async ({ id, data }: { id: string; data: Partial<Project> }) => {
    // 转换为 UpdateProjectRequest 格式
    const updateData = {
      name: data.name,
      description: data.description,
      status: data.status,
      settings: data.settings
    };
    const response = await projectAPI.updateProject(id, updateData);
    return response;
  }
);

export const deleteProject = createAsyncThunk(
  'project/deleteProject',
  async (id: string, { rejectWithValue }) => {
    try {
      await projectAPI.deleteProject(id);
      return id;
    } catch (error: any) {
      console.error('删除项目失败:', error);
      const errorMessage = error?.response?.data?.message || error?.message || '删除项目失败';
      return rejectWithValue(errorMessage);
    }
  }
);

export const getProject = createAsyncThunk(
  'project/getProject',
  async (id: string, { dispatch }) => {
    dispatch(setGlobalLoading(true));
    try {
      const response = await projectAPI.getProject(id);
      return response;
    } finally {
      dispatch(setGlobalLoading(false));
    }
  }
);

export const duplicateProject = createAsyncThunk(
  'project/duplicateProject',
  async ({ id, name }: { id: string; name: string }) => {
    const response = await projectAPI.duplicateProject(id, name);
    return response;
  }
);

export const addPage = createAsyncThunk(
  'project/addPage',
  async ({ projectId, pageData }: { projectId: string; pageData: CreatePageRequest }) => {
    const response = await projectAPI.addPage(projectId, pageData);
    return response;
  }
);

export const updatePage = createAsyncThunk(
  'project/updatePage',
  async ({ projectId, pageId, data }: { projectId: string; pageId: string; data: Partial<ProjectPage> }) => {
    const response = await projectAPI.updatePage(projectId, pageId, data);
    return response;
  }
);

export const deletePage = createAsyncThunk(
  'project/deletePage',
  async ({ projectId, pageId }: { projectId: string; pageId: string }) => {
    await projectAPI.deletePage(projectId, pageId);
    return pageId;
  }
);

// 异步操作：获取项目进展 - 使用统一的API客户端
export const fetchProjectProgress = createAsyncThunk(
  'project/fetchProjectProgress',
  async (projectId: string, { rejectWithValue }) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 [DEBUG] 获取项目进展: ${projectId}`);
      }

      // 使用统一的projectAPI而不是直接fetch
      const response = await projectAPI.getProjectProgress(projectId);

      if (!response.success) {
        throw new Error(response.message || '获取项目进展失败');
      }

      const result = response.data;
      if (!result) {
        throw new Error('API返回空数据');
      }

      // 规范化字段并确保 steps 数组存在
      const normalized = {
        ...result,
        project_id: result.project_id ?? result.projectId,
        steps: Array.isArray(result.steps) ? result.steps : [],
        current_step: result.current_step ?? result.currentStep ?? 'service-mode',
        total_progress: typeof result.total_progress === 'number' ? result.total_progress : (typeof result.totalProgress === 'number' ? result.totalProgress : 0),
      };

      return normalized;
    } catch (error: any) {
      // 网络错误
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return rejectWithValue('网络连接失败，请检查服务器是否启动');
      }

      // 其他错误
      return rejectWithValue(error.message || '获取项目进展失败');
    }
  }
);

// 异步操作：更新步骤进展 - 使用统一的API客户端
export const updateStepProgress = createAsyncThunk(
  'project/updateStepProgress',
  async ({ projectId, stepKey, status, progress, data }: {
    projectId: string;
    stepKey: string;
    status?: string;
    progress?: number;
    data?: any;
  }) => {
    // 使用统一的projectAPI而不是直接fetch
    const response = await projectAPI.updateStepProgress(projectId, stepKey, { status, progress, data });

    if (response.success) {
      return { projectId, stepKey, status, progress, data };
    } else {
      throw new Error(response.message || '更新步骤进展失败');
    }
  }
);

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<ProjectPage | null>) => {
      state.currentPage = action.payload;
    },
    updateCurrentPage: (state, action: PayloadAction<Partial<ProjectPage>>) => {
      if (state.currentPage) {
        state.currentPage = { ...state.currentPage, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;

        // 处理后端返回的数据结构
        const responseData = action.payload as any;
        let projects: Project[] = [];

        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 [DEBUG] Redux processing response:', responseData);
        }

        if (responseData && Array.isArray(responseData.projects)) {
          // API直接返回格式: { projects: [...], pagination: {...} }
          projects = responseData.projects;
          state.pagination = responseData.pagination || state.pagination;
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [DEBUG] Using direct API format, projects:', projects.length);
          }
        } else if (responseData?.data && Array.isArray(responseData.data)) {
          // 嵌套格式: { data: [...], success: true, message: "..." }
          projects = responseData.data;
          state.pagination = responseData.pagination || state.pagination;
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [DEBUG] Using nested array format, projects:', projects.length);
          }
        } else if (responseData?.data && Array.isArray(responseData.data.projects)) {
          // 嵌套格式: { data: { projects: [...], pagination: {...} } }
          projects = responseData.data.projects;
          state.pagination = responseData.data.pagination || state.pagination;
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [DEBUG] Using nested format, projects:', projects.length);
          }
        } else if (Array.isArray(responseData)) {
          // 数组格式: [...]
          projects = responseData;
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [DEBUG] Using array format, projects:', projects.length);
          }
        } else {
          // 默认情况
          projects = [];
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [DEBUG] No valid data found, using empty array');
          }
        }

        // 数据转换：确保字段兼容性
        state.projects = projects.map(project => ({
          ...project,
          // 添加兼容字段
          createdTime: project.created_at || project.createdTime,
          updatedTime: project.updated_at || project.updatedTime,
          // 确保必需字段有默认值
          description: project.description || '',
          author: project.author || project.user_phone || '',
          collaborators: project.collaborators || [],
          pages: project.pages || [],
          settings: project.settings || {},
          // 处理状态字段，确保null状态被转换为draft
          status: project.status || 'draft'
        }));
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取项目列表失败';
      })
      // Create project
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload);
      })
      // Create project with file
      .addCase(createProjectWithFile.fulfilled, (state, action) => {
        state.projects.push(action.payload);
      })
      // Update project
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload;
        }
      })
      // Delete project
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = state.projects.filter(p => p.id !== action.payload);
        if (state.currentProject?.id === action.payload) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || '删除项目失败';
      })
      // Get project
      .addCase(getProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProject.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject = action.payload;
        state.error = null;
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 [DEBUG] getProject.fulfilled - currentProject set to:', action.payload);
        }
      })
      .addCase(getProject.rejected, (state, action) => {
        state.loading = false;
        state.currentProject = null;
        state.error = action.error.message || '获取项目详情失败';
        console.error('🔍 [DEBUG] getProject.rejected - error:', action.error);
      })
      // Duplicate project
      .addCase(duplicateProject.fulfilled, (state, action) => {
        state.projects.push(action.payload);
      })
      // Add page
      .addCase(addPage.fulfilled, (state, action) => {
        if (state.currentProject) {
          if (!state.currentProject.pages) {
            state.currentProject.pages = [];
          }
          state.currentProject.pages.push(action.payload);
        }
      })
      // Update page
      .addCase(updatePage.fulfilled, (state, action) => {
        if (state.currentProject) {
          if (!state.currentProject.pages) {
            state.currentProject.pages = [];
          }
          const index = state.currentProject.pages.findIndex(p => p.id === action.payload.id);
          if (index !== -1) {
            state.currentProject.pages[index] = action.payload;
          }
        }
        if (state.currentPage?.id === action.payload.id) {
          state.currentPage = action.payload;
        }
      })
      // Delete page
      .addCase(deletePage.fulfilled, (state, action) => {
        if (state.currentProject) {
          if (!state.currentProject.pages) {
            state.currentProject.pages = [];
          }
          state.currentProject.pages = state.currentProject.pages.filter(p => p.id !== action.payload);
        }
        if (state.currentPage?.id === action.payload) {
          state.currentPage = null;
        }
      });
  },
});

export const { clearError, setCurrentProject, setCurrentPage, updateCurrentPage } = projectSlice.actions;
export default projectSlice.reducer;
