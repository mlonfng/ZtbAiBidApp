/**
 * 离线功能管理器
 * 提供完整的离线工作能力
 */

import { localStorageManager, LocalProject } from './localStorageManager';
import { aiModeManager } from './aiModeManager';

export interface OfflineTask {
  id: string;
  type: 'ai_request' | 'file_upload' | 'data_sync' | 'export';
  projectId?: string;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineCapability {
  projectManagement: boolean;
  fileEditing: boolean;
  contentGeneration: boolean;
  documentExport: boolean;
  dataSync: boolean;
}

export interface SyncStatus {
  lastSync: string;
  pendingTasks: number;
  failedTasks: number;
  isOnline: boolean;
  autoSync: boolean;
}

class OfflineManager {
  private isOnline: boolean = navigator.onLine;
  private pendingTasks: OfflineTask[] = [];
  private syncInProgress: boolean = false;
  private autoSyncEnabled: boolean = true;
  private syncInterval: number = 5 * 60 * 1000; // 5分钟
  private syncTimer?: NodeJS.Timeout;

  constructor() {
    this.initializeOfflineSupport();
    this.loadPendingTasks();
    this.setupEventListeners();
    this.startAutoSync();
  }

  // 初始化离线支持
  private initializeOfflineSupport(): void {
    try {
      // 注册Service Worker（如果支持）
      if ('serviceWorker' in navigator) {
        this.registerServiceWorker();
      }

      // 设置离线存储
      this.setupOfflineStorage();
      
      console.log('离线功能初始化完成');
    } catch (error) {
      console.error('初始化离线功能失败:', error);
    }
  }

  // 注册Service Worker
  private async registerServiceWorker(): Promise<void> {
    try {
      // 检查是否在Electron环境中
      const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');

      // 在生产环境且非Electron环境中注册Service Worker
      if (process.env.NODE_ENV === 'production' && !isElectron) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker注册成功:', registration);
      } else if (isElectron) {
        console.log('Electron环境中跳过Service Worker注册');
      }
    } catch (error) {
      console.error('Service Worker注册失败:', error);
    }
  }

  // 设置离线存储
  private setupOfflineStorage(): void {
    // 检查IndexedDB支持
    if ('indexedDB' in window) {
      // 可以使用IndexedDB存储大文件
      console.log('IndexedDB可用，支持大文件离线存储');
    }

    // 检查Cache API支持
    if ('caches' in window) {
      // 可以缓存静态资源
      console.log('Cache API可用，支持静态资源缓存');
    }
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    // 监听网络状态变化
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('网络已连接，开始同步离线数据');
      this.syncPendingTasks();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('网络已断开，切换到离线模式');
    });

    // 监听页面卸载，保存待处理任务
    window.addEventListener('beforeunload', () => {
      this.savePendingTasks();
    });
  }

  // 开始自动同步
  private startAutoSync(): void {
    if (this.autoSyncEnabled) {
      this.syncTimer = setInterval(() => {
        if (this.isOnline && this.pendingTasks.length > 0) {
          this.syncPendingTasks();
        }
      }, this.syncInterval);
    }
  }

  // 停止自动同步
  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  // 加载待处理任务
  private loadPendingTasks(): void {
    try {
      const cache = localStorageManager.getCache();
      this.pendingTasks = cache.userPreferences.offlineTasks || [];
    } catch (error) {
      console.error('加载待处理任务失败:', error);
      this.pendingTasks = [];
    }
  }

  // 保存待处理任务
  private savePendingTasks(): void {
    try {
      const cache = localStorageManager.getCache();
      cache.userPreferences.offlineTasks = this.pendingTasks;
      localStorageManager.saveCache(cache);
    } catch (error) {
      console.error('保存待处理任务失败:', error);
    }
  }

  // 添加离线任务
  addOfflineTask(task: Omit<OfflineTask, 'id' | 'createdAt' | 'status' | 'retryCount'>): string {
    const offlineTask: OfflineTask = {
      ...task,
      id: this.generateTaskId(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
      maxRetries: task.maxRetries || 3,
    };

    this.pendingTasks.push(offlineTask);
    this.savePendingTasks();

    // 如果在线，立即尝试处理
    if (this.isOnline) {
      this.processTask(offlineTask);
    }

    return offlineTask.id;
  }

  // 生成任务ID
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 处理单个任务
  private async processTask(task: OfflineTask): Promise<void> {
    try {
      task.status = 'processing';
      
      switch (task.type) {
        case 'ai_request':
          await this.processAIRequest(task);
          break;
        case 'file_upload':
          await this.processFileUpload(task);
          break;
        case 'data_sync':
          await this.processDataSync(task);
          break;
        case 'export':
          await this.processExport(task);
          break;
        default:
          throw new Error(`未知任务类型: ${task.type}`);
      }

      task.status = 'completed';
      task.completedAt = new Date().toISOString();
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : '任务处理失败';
      task.retryCount++;

      console.error(`任务处理失败 (${task.id}):`, error);
    }

    this.savePendingTasks();
  }

  // 处理AI请求任务
  private async processAIRequest(task: OfflineTask): Promise<void> {
    const { messages, options } = task.data;
    const response = await aiModeManager.sendRequest(messages, options);
    
    if (!response.success) {
      throw new Error(response.error || 'AI请求失败');
    }

    // 更新项目数据
    if (task.projectId) {
      const project = localStorageManager.getProject(task.projectId);
      if (project) {
        // 根据任务类型更新相应的项目数据
        this.updateProjectWithAIResponse(project, task.data.context, response.data);
        localStorageManager.saveProject(project);
      }
    }
  }

  // 处理文件上传任务
  private async processFileUpload(task: OfflineTask): Promise<void> {
    const { file, uploadUrl } = task.data;
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`文件上传失败: ${response.status}`);
    }

    const result = await response.json();
    
    // 更新项目数据
    if (task.projectId) {
      const project = localStorageManager.getProject(task.projectId);
      if (project) {
        this.updateProjectWithFileUpload(project, result);
        localStorageManager.saveProject(project);
      }
    }
  }

  // 处理数据同步任务
  private async processDataSync(task: OfflineTask): Promise<void> {
    const { projectData } = task.data;
    
    const response = await fetch('/api/projects/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      throw new Error(`数据同步失败: ${response.status}`);
    }
  }

  // 处理导出任务
  private async processExport(task: OfflineTask): Promise<void> {
    const { projectId, format, options } = task.data;
    
    const response = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, format, options }),
    });

    if (!response.ok) {
      throw new Error(`文档导出失败: ${response.status}`);
    }

    const blob = await response.blob();
    
    // 触发下载
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project_${projectId}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 更新项目AI响应数据
  private updateProjectWithAIResponse(project: LocalProject, context: string, aiData: any): void {
    switch (context) {
      case 'bid_analysis':
        project.data.bidAnalysis = aiData;
        break;
      case 'framework_generation':
        project.data.framework = aiData;
        break;
      case 'content_generation':
        project.data.content = { ...project.data.content, ...aiData };
        break;
      default:
        break;
    }
  }

  // 更新项目文件上传数据
  private updateProjectWithFileUpload(project: LocalProject, fileData: any): void {
    if (!project.data.materials) {
      project.data.materials = [];
    }
    project.data.materials.push(fileData);
  }

  // 同步所有待处理任务
  async syncPendingTasks(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;

    try {
      const pendingTasks = this.pendingTasks.filter(
        task => task.status === 'pending' || (task.status === 'failed' && task.retryCount < task.maxRetries)
      );

      for (const task of pendingTasks) {
        await this.processTask(task);
      }

      // 清理已完成的任务
      this.pendingTasks = this.pendingTasks.filter(
        task => task.status !== 'completed'
      );

      this.savePendingTasks();
    } catch (error) {
      console.error('同步待处理任务失败:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // 获取离线能力
  getOfflineCapabilities(): OfflineCapability {
    return {
      projectManagement: true, // 项目管理完全离线
      fileEditing: true, // 文件编辑离线支持
      contentGeneration: aiModeManager.getStatus().localAvailable, // 取决于本地AI
      documentExport: true, // 基础导出离线支持
      dataSync: this.isOnline, // 数据同步需要网络
    };
  }

  // 获取同步状态
  getSyncStatus(): SyncStatus {
    const cache = localStorageManager.getCache();
    
    return {
      lastSync: cache.userPreferences.lastSync || '从未同步',
      pendingTasks: this.pendingTasks.filter(t => t.status === 'pending').length,
      failedTasks: this.pendingTasks.filter(t => t.status === 'failed').length,
      isOnline: this.isOnline,
      autoSync: this.autoSyncEnabled,
    };
  }

  // 手动同步
  async manualSync(): Promise<boolean> {
    try {
      await this.syncPendingTasks();
      
      // 更新最后同步时间
      const cache = localStorageManager.getCache();
      cache.userPreferences.lastSync = new Date().toISOString();
      localStorageManager.saveCache(cache);
      
      return true;
    } catch (error) {
      console.error('手动同步失败:', error);
      return false;
    }
  }

  // 设置自动同步
  setAutoSync(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
    
    if (enabled) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  // 清理失败任务
  clearFailedTasks(): void {
    this.pendingTasks = this.pendingTasks.filter(task => task.status !== 'failed');
    this.savePendingTasks();
  }

  // 重试失败任务
  retryFailedTasks(): void {
    const failedTasks = this.pendingTasks.filter(task => task.status === 'failed');
    
    failedTasks.forEach(task => {
      task.status = 'pending';
      task.retryCount = 0;
      task.error = undefined;
    });

    this.savePendingTasks();

    if (this.isOnline) {
      this.syncPendingTasks();
    }
  }

  // 获取网络状态
  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  // 销毁管理器
  destroy(): void {
    this.stopAutoSync();
    this.savePendingTasks();
    
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
    window.removeEventListener('beforeunload', () => {});
  }
}

// 导出单例实例
export const offlineManager = new OfflineManager();
export default offlineManager;
