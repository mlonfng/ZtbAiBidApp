/**
 * 本地数据存储管理器
 * 提供统一的本地数据存储和管理接口
 */

export interface LocalProject {
  id: string;
  name: string;
  type: string;
  description?: string;
  status: 'active' | 'completed' | 'paused' | 'archived';
  progress: number;
  createdAt: string;
  updatedAt: string;
  lastModified: string;
  data: {
    bidAnalysis?: any;
    materials?: any[];
    framework?: any;
    content?: any;
    formatConfig?: any;
    exportConfig?: any;
  };
  settings: {
    aiMode: 'local' | 'remote' | 'hybrid';
    serviceMode: 'free' | 'ai' | 'professional';
  };
}

export interface LocalSettings {
  app: {
    theme: 'light' | 'dark' | 'auto';
    language: 'zh-CN' | 'en-US';
    autoSave: boolean;
    autoBackup: boolean;
  };
  ai: {
    provider: 'deepseek' | 'openai' | 'local' | 'custom';
    apiKey?: string;
    apiUrl?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
  desktop: {
    startWithSystem: boolean;
    minimizeToTray: boolean;
    closeToTray: boolean;
    autoUpdate: boolean;
  };
}

export interface CacheData {
  apiResponses: Record<string, any>;
  fileCache: Record<string, any>;
  userPreferences: Record<string, any>;
  lastCleanup: string;
}

class LocalStorageManager {
  private readonly STORAGE_KEYS = {
    PROJECTS: 'ztbai_projects',
    SETTINGS: 'ztbai_settings',
    CACHE: 'ztbai_cache',
    USER_DATA: 'ztbai_user_data',
    BACKUP: 'ztbai_backup',
  };

  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly CACHE_EXPIRE_DAYS = 7;

  constructor() {
    this.initializeStorage();
  }

  // 初始化存储
  private initializeStorage(): void {
    try {
      // 检查是否是首次使用
      if (!this.getSettings()) {
        this.setDefaultSettings();
      }

      // 清理过期缓存
      this.cleanupExpiredCache();
    } catch (error) {
      console.error('初始化本地存储失败:', error);
    }
  }

  // 项目管理
  getProjects(): LocalProject[] {
    try {
      const projects = localStorage.getItem(this.STORAGE_KEYS.PROJECTS);
      return projects ? JSON.parse(projects) : [];
    } catch (error) {
      console.error('获取项目列表失败:', error);
      return [];
    }
  }

  saveProject(project: LocalProject): boolean {
    try {
      const projects = this.getProjects();
      const existingIndex = projects.findIndex(p => p.id === project.id);
      
      project.updatedAt = new Date().toISOString();
      project.lastModified = new Date().toLocaleString('zh-CN');

      if (existingIndex >= 0) {
        projects[existingIndex] = project;
      } else {
        projects.push(project);
      }

      localStorage.setItem(this.STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      
      // 自动备份
      if (this.getSettings()?.app?.autoBackup) {
        this.createBackup();
      }

      return true;
    } catch (error) {
      console.error('保存项目失败:', error);
      return false;
    }
  }

  getProject(id: string): LocalProject | null {
    try {
      const projects = this.getProjects();
      return projects.find(p => p.id === id) || null;
    } catch (error) {
      console.error('获取项目失败:', error);
      return null;
    }
  }

  deleteProject(id: string): boolean {
    try {
      const projects = this.getProjects();
      const filteredProjects = projects.filter(p => p.id !== id);
      localStorage.setItem(this.STORAGE_KEYS.PROJECTS, JSON.stringify(filteredProjects));
      return true;
    } catch (error) {
      console.error('删除项目失败:', error);
      return false;
    }
  }

  // 设置管理
  getSettings(): LocalSettings | null {
    try {
      const settings = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('获取设置失败:', error);
      return null;
    }
  }

  saveSettings(settings: LocalSettings): boolean {
    try {
      localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('保存设置失败:', error);
      return false;
    }
  }

  private setDefaultSettings(): void {
    const defaultSettings: LocalSettings = {
      app: {
        theme: 'light',
        language: 'zh-CN',
        autoSave: true,
        autoBackup: true,
      },
      ai: {
        provider: 'deepseek',
        temperature: 0.7,
        maxTokens: 2000,
      },
      desktop: {
        startWithSystem: false,
        minimizeToTray: true,
        closeToTray: false,
        autoUpdate: true,
      },
    };

    this.saveSettings(defaultSettings);
  }

  // 缓存管理
  getCache(): CacheData {
    try {
      const cache = localStorage.getItem(this.STORAGE_KEYS.CACHE);
      return cache ? JSON.parse(cache) : {
        apiResponses: {},
        fileCache: {},
        userPreferences: {},
        lastCleanup: new Date().toISOString(),
      };
    } catch (error) {
      console.error('获取缓存失败:', error);
      return {
        apiResponses: {},
        fileCache: {},
        userPreferences: {},
        lastCleanup: new Date().toISOString(),
      };
    }
  }

  saveCache(cache: CacheData): boolean {
    try {
      // 检查缓存大小
      const cacheSize = new Blob([JSON.stringify(cache)]).size;
      if (cacheSize > this.MAX_CACHE_SIZE) {
        this.cleanupCache(cache);
      }

      localStorage.setItem(this.STORAGE_KEYS.CACHE, JSON.stringify(cache));
      return true;
    } catch (error) {
      console.error('保存缓存失败:', error);
      return false;
    }
  }

  private cleanupExpiredCache(): void {
    try {
      const cache = this.getCache();
      const now = new Date();
      const expireDate = new Date(now.getTime() - this.CACHE_EXPIRE_DAYS * 24 * 60 * 60 * 1000);

      // 清理过期的API响应缓存
      Object.keys(cache.apiResponses).forEach(key => {
        const item = cache.apiResponses[key];
        if (item.timestamp && new Date(item.timestamp) < expireDate) {
          delete cache.apiResponses[key];
        }
      });

      cache.lastCleanup = now.toISOString();
      this.saveCache(cache);
    } catch (error) {
      console.error('清理过期缓存失败:', error);
    }
  }

  private cleanupCache(cache: CacheData): void {
    // 清理最旧的缓存项
    const apiKeys = Object.keys(cache.apiResponses);
    const sortedKeys = apiKeys.sort((a, b) => {
      const aTime = cache.apiResponses[a].timestamp || 0;
      const bTime = cache.apiResponses[b].timestamp || 0;
      return aTime - bTime;
    });

    // 删除最旧的一半缓存
    const deleteCount = Math.floor(sortedKeys.length / 2);
    for (let i = 0; i < deleteCount; i++) {
      delete cache.apiResponses[sortedKeys[i]];
    }
  }

  // 备份和恢复
  createBackup(): boolean {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        projects: this.getProjects(),
        settings: this.getSettings(),
        version: '1.0.0',
      };

      localStorage.setItem(this.STORAGE_KEYS.BACKUP, JSON.stringify(backup));
      return true;
    } catch (error) {
      console.error('创建备份失败:', error);
      return false;
    }
  }

  restoreBackup(): boolean {
    try {
      const backup = localStorage.getItem(this.STORAGE_KEYS.BACKUP);
      if (!backup) {
        return false;
      }

      const backupData = JSON.parse(backup);
      
      // 恢复项目
      if (backupData.projects) {
        localStorage.setItem(this.STORAGE_KEYS.PROJECTS, JSON.stringify(backupData.projects));
      }

      // 恢复设置
      if (backupData.settings) {
        localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(backupData.settings));
      }

      return true;
    } catch (error) {
      console.error('恢复备份失败:', error);
      return false;
    }
  }

  // 导出和导入
  exportData(): string {
    try {
      const data = {
        projects: this.getProjects(),
        settings: this.getSettings(),
        cache: this.getCache(),
        exportTime: new Date().toISOString(),
        version: '1.0.0',
      };

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('导出数据失败:', error);
      return '';
    }
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.projects) {
        localStorage.setItem(this.STORAGE_KEYS.PROJECTS, JSON.stringify(data.projects));
      }

      if (data.settings) {
        localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      }

      return true;
    } catch (error) {
      console.error('导入数据失败:', error);
      return false;
    }
  }

  // 存储统计
  getStorageStats(): {
    totalSize: number;
    projectsSize: number;
    settingsSize: number;
    cacheSize: number;
    available: number;
  } {
    try {
      const getSize = (key: string) => {
        const item = localStorage.getItem(key);
        return item ? new Blob([item]).size : 0;
      };

      const projectsSize = getSize(this.STORAGE_KEYS.PROJECTS);
      const settingsSize = getSize(this.STORAGE_KEYS.SETTINGS);
      const cacheSize = getSize(this.STORAGE_KEYS.CACHE);
      const totalSize = projectsSize + settingsSize + cacheSize;

      // 估算可用空间（localStorage通常限制为5-10MB）
      const estimatedLimit = 5 * 1024 * 1024; // 5MB
      const available = Math.max(0, estimatedLimit - totalSize);

      return {
        totalSize,
        projectsSize,
        settingsSize,
        cacheSize,
        available,
      };
    } catch (error) {
      console.error('获取存储统计失败:', error);
      return {
        totalSize: 0,
        projectsSize: 0,
        settingsSize: 0,
        cacheSize: 0,
        available: 0,
      };
    }
  }

  // 清理所有数据
  clearAllData(): boolean {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // 重新初始化
      this.initializeStorage();
      return true;
    } catch (error) {
      console.error('清理所有数据失败:', error);
      return false;
    }
  }
}

// 导出单例实例
export const localStorageManager = new LocalStorageManager();
export default localStorageManager;
