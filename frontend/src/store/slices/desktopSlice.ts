import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { localStorageManager, LocalProject, LocalSettings } from '../../services/localStorageManager';
import { aiModeManager, AIMode, AIProvider } from '../../services/aiModeManager';
import { offlineManager } from '../../services/offlineManager';

// 桌面应用状态接口
export interface DesktopState {
  // 系统状态
  systemStatus: {
    backend: boolean;
    database: boolean;
    aiModel: boolean;
    network: 'online' | 'offline' | 'unstable';
  };
  
  // AI配置状态
  aiConfig: {
    mode: AIMode;
    provider: AIProvider;
    localAvailable: boolean;
    remoteAvailable: boolean;
    currentService: 'local' | 'remote';
  };
  
  // 离线状态
  offlineStatus: {
    isOnline: boolean;
    pendingTasks: number;
    failedTasks: number;
    lastSync: string;
    autoSync: boolean;
  };
  
  // 本地项目
  localProjects: LocalProject[];
  currentProject: LocalProject | null;
  
  // 应用设置
  settings: LocalSettings | null;
  
  // 存储统计
  storageStats: {
    totalSize: number;
    projectsSize: number;
    settingsSize: number;
    cacheSize: number;
    available: number;
  };
  
  // 加载状态
  loading: {
    projects: boolean;
    settings: boolean;
    sync: boolean;
    aiRequest: boolean;
  };
  
  // 错误状态
  error: string | null;
}

// 初始状态
const initialState: DesktopState = {
  systemStatus: {
    backend: false,
    database: false,
    aiModel: false,
    network: 'online',
  },
  aiConfig: {
    mode: 'hybrid',
    provider: 'deepseek',
    localAvailable: false,
    remoteAvailable: false,
    currentService: 'remote',
  },
  offlineStatus: {
    isOnline: true,
    pendingTasks: 0,
    failedTasks: 0,
    lastSync: '从未同步',
    autoSync: true,
  },
  localProjects: [],
  currentProject: null,
  settings: null,
  storageStats: {
    totalSize: 0,
    projectsSize: 0,
    settingsSize: 0,
    cacheSize: 0,
    available: 0,
  },
  loading: {
    projects: false,
    settings: false,
    sync: false,
    aiRequest: false,
  },
  error: null,
};

// 异步操作

// 初始化桌面应用
export const initializeDesktopApp = createAsyncThunk(
  'desktop/initialize',
  async () => {
    // 加载本地数据
    const projects = localStorageManager.getProjects();
    const settings = localStorageManager.getSettings();
    const storageStats = localStorageManager.getStorageStats();
    
    // 获取AI状态
    const aiStatus = aiModeManager.getStatus();
    
    // 获取离线状态
    const offlineStatus = offlineManager.getSyncStatus();
    
    return {
      projects,
      settings,
      storageStats,
      aiStatus,
      offlineStatus,
    };
  }
);

// 加载本地项目
export const loadLocalProjects = createAsyncThunk(
  'desktop/loadProjects',
  async () => {
    return localStorageManager.getProjects();
  }
);

// 保存项目
export const saveLocalProject = createAsyncThunk(
  'desktop/saveProject',
  async (project: LocalProject) => {
    const success = localStorageManager.saveProject(project);
    if (!success) {
      throw new Error('保存项目失败');
    }
    return project;
  }
);

// 删除项目
export const deleteLocalProject = createAsyncThunk(
  'desktop/deleteProject',
  async (projectId: string) => {
    const success = localStorageManager.deleteProject(projectId);
    if (!success) {
      throw new Error('删除项目失败');
    }
    return projectId;
  }
);

// 保存设置
export const saveAppSettings = createAsyncThunk(
  'desktop/saveSettings',
  async (settings: LocalSettings) => {
    const success = localStorageManager.saveSettings(settings);
    if (!success) {
      throw new Error('保存设置失败');
    }
    return settings;
  }
);

// 切换AI模式
export const switchAIMode = createAsyncThunk(
  'desktop/switchAIMode',
  async (mode: AIMode) => {
    const success = await aiModeManager.switchMode(mode);
    if (!success) {
      throw new Error('切换AI模式失败');
    }
    return aiModeManager.getStatus();
  }
);

// 发送AI请求
export const sendAIRequest = createAsyncThunk(
  'desktop/sendAIRequest',
  async (params: { messages: any[]; options?: any; projectId?: string }) => {
    const { messages, options, projectId } = params;
    
    if (!offlineManager.isNetworkOnline() && !aiModeManager.getStatus().localAvailable) {
      // 添加到离线任务队列
      const taskId = offlineManager.addOfflineTask({
        type: 'ai_request',
        projectId,
        data: { messages, options, context: 'general' },
        maxRetries: 3,
      });
      
      return {
        success: false,
        taskId,
        message: '网络不可用，已添加到离线任务队列',
      };
    }
    
    const response = await aiModeManager.sendRequest(messages, options);
    return response;
  }
);

// 同步离线数据
export const syncOfflineData = createAsyncThunk(
  'desktop/syncOfflineData',
  async () => {
    const success = await offlineManager.manualSync();
    if (!success) {
      throw new Error('同步失败');
    }
    return offlineManager.getSyncStatus();
  }
);

// 刷新系统状态
export const refreshSystemStatus = createAsyncThunk(
  'desktop/refreshSystemStatus',
  async () => {
    // 刷新AI状态
    await aiModeManager.refreshStatus();
    const aiStatus = aiModeManager.getStatus();
    
    // 获取离线状态
    const offlineStatus = offlineManager.getSyncStatus();
    
    // 获取存储统计
    const storageStats = localStorageManager.getStorageStats();
    
    return {
      aiStatus,
      offlineStatus,
      storageStats,
    };
  }
);

// 创建slice
const desktopSlice = createSlice({
  name: 'desktop',
  initialState,
  reducers: {
    // 设置当前项目
    setCurrentProject: (state, action: PayloadAction<LocalProject | null>) => {
      state.currentProject = action.payload;
    },
    
    // 更新系统状态
    updateSystemStatus: (state, action: PayloadAction<Partial<DesktopState['systemStatus']>>) => {
      state.systemStatus = { ...state.systemStatus, ...action.payload };
    },
    
    // 更新网络状态
    updateNetworkStatus: (state, action: PayloadAction<'online' | 'offline' | 'unstable'>) => {
      state.systemStatus.network = action.payload;
      state.offlineStatus.isOnline = action.payload === 'online';
    },
    
    // 更新离线状态
    updateOfflineStatus: (state, action: PayloadAction<Partial<DesktopState['offlineStatus']>>) => {
      state.offlineStatus = { ...state.offlineStatus, ...action.payload };
    },
    
    // 清除错误
    clearError: (state) => {
      state.error = null;
    },
    
    // 设置错误
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    // 初始化桌面应用
    builder
      .addCase(initializeDesktopApp.pending, (state) => {
        state.loading.projects = true;
        state.loading.settings = true;
      })
      .addCase(initializeDesktopApp.fulfilled, (state, action) => {
        const { projects, settings, storageStats, aiStatus, offlineStatus } = action.payload;
        
        state.localProjects = projects;
        state.settings = settings;
        state.storageStats = storageStats;
        state.aiConfig = aiStatus;
        state.offlineStatus = offlineStatus;
        
        state.loading.projects = false;
        state.loading.settings = false;
        state.error = null;
      })
      .addCase(initializeDesktopApp.rejected, (state, action) => {
        state.loading.projects = false;
        state.loading.settings = false;
        state.error = action.error.message || '初始化失败';
      });

    // 加载项目
    builder
      .addCase(loadLocalProjects.pending, (state) => {
        state.loading.projects = true;
      })
      .addCase(loadLocalProjects.fulfilled, (state, action) => {
        state.localProjects = action.payload;
        state.loading.projects = false;
        state.error = null;
      })
      .addCase(loadLocalProjects.rejected, (state, action) => {
        state.loading.projects = false;
        state.error = action.error.message || '加载项目失败';
      });

    // 保存项目
    builder
      .addCase(saveLocalProject.fulfilled, (state, action) => {
        const project = action.payload;
        const existingIndex = state.localProjects.findIndex(p => p.id === project.id);
        
        if (existingIndex >= 0) {
          state.localProjects[existingIndex] = project;
        } else {
          state.localProjects.push(project);
        }
        
        if (state.currentProject?.id === project.id) {
          state.currentProject = project;
        }
        
        state.error = null;
      })
      .addCase(saveLocalProject.rejected, (state, action) => {
        state.error = action.error.message || '保存项目失败';
      });

    // 删除项目
    builder
      .addCase(deleteLocalProject.fulfilled, (state, action) => {
        const projectId = action.payload;
        state.localProjects = state.localProjects.filter(p => p.id !== projectId);
        
        if (state.currentProject?.id === projectId) {
          state.currentProject = null;
        }
        
        state.error = null;
      })
      .addCase(deleteLocalProject.rejected, (state, action) => {
        state.error = action.error.message || '删除项目失败';
      });

    // 保存设置
    builder
      .addCase(saveAppSettings.pending, (state) => {
        state.loading.settings = true;
      })
      .addCase(saveAppSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.loading.settings = false;
        state.error = null;
      })
      .addCase(saveAppSettings.rejected, (state, action) => {
        state.loading.settings = false;
        state.error = action.error.message || '保存设置失败';
      });

    // 切换AI模式
    builder
      .addCase(switchAIMode.fulfilled, (state, action) => {
        state.aiConfig = action.payload;
        state.error = null;
      })
      .addCase(switchAIMode.rejected, (state, action) => {
        state.error = action.error.message || '切换AI模式失败';
      });

    // AI请求
    builder
      .addCase(sendAIRequest.pending, (state) => {
        state.loading.aiRequest = true;
      })
      .addCase(sendAIRequest.fulfilled, (state) => {
        state.loading.aiRequest = false;
        state.error = null;
      })
      .addCase(sendAIRequest.rejected, (state, action) => {
        state.loading.aiRequest = false;
        state.error = action.error.message || 'AI请求失败';
      });

    // 同步离线数据
    builder
      .addCase(syncOfflineData.pending, (state) => {
        state.loading.sync = true;
      })
      .addCase(syncOfflineData.fulfilled, (state, action) => {
        state.offlineStatus = action.payload;
        state.loading.sync = false;
        state.error = null;
      })
      .addCase(syncOfflineData.rejected, (state, action) => {
        state.loading.sync = false;
        state.error = action.error.message || '同步失败';
      });

    // 刷新系统状态
    builder
      .addCase(refreshSystemStatus.fulfilled, (state, action) => {
        const { aiStatus, offlineStatus, storageStats } = action.payload;
        state.aiConfig = aiStatus;
        state.offlineStatus = offlineStatus;
        state.storageStats = storageStats;
        state.error = null;
      })
      .addCase(refreshSystemStatus.rejected, (state, action) => {
        state.error = action.error.message || '刷新状态失败';
      });
  },
});

// 导出actions
export const {
  setCurrentProject,
  updateSystemStatus,
  updateNetworkStatus,
  updateOfflineStatus,
  clearError,
  setError,
} = desktopSlice.actions;

// 导出reducer
export default desktopSlice.reducer;
