/**
 * 自动更新服务
 * 处理桌面应用的自动更新功能
 */

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  downloadUrl: string;
  fileSize: number;
  checksum: string;
  mandatory: boolean;
}

export interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  total: number;
  transferred: number;
}

export interface UpdateStatus {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  error: string | null;
  progress: UpdateProgress | null;
  updateInfo: UpdateInfo | null;
}

class AutoUpdater {
  private currentVersion: string;
  private updateCheckInterval: number = 24 * 60 * 60 * 1000; // 24小时
  private updateTimer?: NodeJS.Timeout;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.currentVersion = this.getInitialVersion();
    this.initializeUpdater();
  }

  // 获取当前版本
  private getInitialVersion(): string {
    // 从package.json或环境变量获取版本
    return process.env.REACT_APP_VERSION || '2.1.0';
  }

  // 初始化更新器
  private initializeUpdater(): void {
    if (this.isElectron()) {
      this.setupElectronUpdater();
    } else {
      this.setupWebUpdater();
    }
  }

  // 检查是否在Electron环境中
  private isElectron(): boolean {
    return !!(window as any).electronAPI;
  }

  // 设置Electron更新器
  private setupElectronUpdater(): void {
    const electronAPI = (window as any).electronAPI;
    
    if (electronAPI && electronAPI.updater) {
      // 监听更新事件
      electronAPI.updater.onUpdateAvailable((updateInfo: UpdateInfo) => {
        this.emit('update-available', updateInfo);
      });

      electronAPI.updater.onUpdateNotAvailable(() => {
        this.emit('update-not-available');
      });

      electronAPI.updater.onUpdateDownloaded((updateInfo: UpdateInfo) => {
        this.emit('update-downloaded', updateInfo);
      });

      electronAPI.updater.onDownloadProgress((progress: UpdateProgress) => {
        this.emit('download-progress', progress);
      });

      electronAPI.updater.onError((error: string) => {
        this.emit('error', error);
      });
    }
  }

  // 设置Web更新器
  private setupWebUpdater(): void {
    // Web环境下的更新检查
    console.log('Web环境下的更新检查已初始化');
  }

  // 检查更新
  async checkForUpdates(): Promise<UpdateStatus> {
    try {
      this.emit('checking-for-update');

      if (this.isElectron()) {
        return await this.checkElectronUpdates();
      } else {
        return await this.checkWebUpdates();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '检查更新失败';
      this.emit('error', errorMessage);
      
      return {
        checking: false,
        available: false,
        downloading: false,
        downloaded: false,
        error: errorMessage,
        progress: null,
        updateInfo: null,
      };
    }
  }

  // 检查Electron更新
  private async checkElectronUpdates(): Promise<UpdateStatus> {
    const electronAPI = (window as any).electronAPI;
    
    if (electronAPI && electronAPI.updater) {
      return await electronAPI.updater.checkForUpdates();
    }

    throw new Error('Electron更新API不可用');
  }

  // 检查Web更新
  private async checkWebUpdates(): Promise<UpdateStatus> {
    try {
      // 从服务器获取最新版本信息
      const response = await fetch('/api/version/latest');
      const latestVersion = await response.json();

      const isUpdateAvailable = this.compareVersions(latestVersion.version, this.currentVersion) > 0;

      if (isUpdateAvailable) {
        const updateInfo: UpdateInfo = {
          version: latestVersion.version,
          releaseDate: latestVersion.releaseDate,
          releaseNotes: latestVersion.releaseNotes,
          downloadUrl: latestVersion.downloadUrl,
          fileSize: latestVersion.fileSize,
          checksum: latestVersion.checksum,
          mandatory: latestVersion.mandatory || false,
        };

        this.emit('update-available', updateInfo);

        return {
          checking: false,
          available: true,
          downloading: false,
          downloaded: false,
          error: null,
          progress: null,
          updateInfo,
        };
      } else {
        this.emit('update-not-available');

        return {
          checking: false,
          available: false,
          downloading: false,
          downloaded: false,
          error: null,
          progress: null,
          updateInfo: null,
        };
      }
    } catch (error) {
      throw new Error('无法连接到更新服务器');
    }
  }

  // 下载更新
  async downloadUpdate(): Promise<void> {
    if (this.isElectron()) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && electronAPI.updater) {
        await electronAPI.updater.downloadUpdate();
      }
    } else {
      // Web环境下提示用户手动更新
      this.emit('update-manual-required');
    }
  }

  // 安装更新
  async installUpdate(): Promise<void> {
    if (this.isElectron()) {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && electronAPI.updater) {
        await electronAPI.updater.quitAndInstall();
      }
    } else {
      // Web环境下刷新页面
      window.location.reload();
    }
  }

  // 比较版本号
  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  // 启动自动检查
  startAutoCheck(): void {
    this.stopAutoCheck();
    
    this.updateTimer = setInterval(() => {
      this.checkForUpdates();
    }, this.updateCheckInterval);
  }

  // 停止自动检查
  stopAutoCheck(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }
  }

  // 设置检查间隔
  setCheckInterval(interval: number): void {
    this.updateCheckInterval = interval;
    
    if (this.updateTimer) {
      this.startAutoCheck();
    }
  }

  // 事件监听
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  // 移除事件监听
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // 触发事件
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // 获取当前版本
  public getCurrentVersion(): string {
    return this.currentVersion;
  }

  // 获取更新配置
  getUpdateConfig(): {
    autoCheck: boolean;
    checkInterval: number;
    allowPrerelease: boolean;
  } {
    const settings = localStorage.getItem('ztbai_update_settings');
    
    if (settings) {
      return JSON.parse(settings);
    }

    return {
      autoCheck: true,
      checkInterval: this.updateCheckInterval,
      allowPrerelease: false,
    };
  }

  // 保存更新配置
  saveUpdateConfig(config: {
    autoCheck: boolean;
    checkInterval: number;
    allowPrerelease: boolean;
  }): void {
    localStorage.setItem('ztbai_update_settings', JSON.stringify(config));
    
    this.setCheckInterval(config.checkInterval);
    
    if (config.autoCheck) {
      this.startAutoCheck();
    } else {
      this.stopAutoCheck();
    }
  }

  // 销毁更新器
  destroy(): void {
    this.stopAutoCheck();
    this.listeners.clear();
  }
}

// 导出单例实例
export const autoUpdater = new AutoUpdater();
export default autoUpdater;
