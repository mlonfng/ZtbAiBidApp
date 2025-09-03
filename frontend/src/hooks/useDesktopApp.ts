import { useEffect, useCallback } from 'react';
// import { useAppDispatch } from '../store';
import { message } from 'antd';

// 桌面应用状态类型
interface SystemStatus {
  backend: boolean;
  version: string;
  platform: string;
}

interface ElectronAPI {
  checkSystemStatus: () => Promise<SystemStatus>;
  openFileDialog: (options: any) => Promise<any>;
  saveFileDialog: (options: any) => Promise<any>;
  openPath: (path: string) => Promise<{ success: boolean; message?: string }>;
  showMessageBox: (options: any) => Promise<any>;
  restartApp: () => Promise<void>;
  quitApp: () => Promise<void>;
  onSystemEvent: (callback: (channel: string, data: any) => void) => void;
  removeAllListeners: (channel: string) => void;
}

interface AppInfo {
  version: string;
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    appInfo?: AppInfo;
  }
}

export const useDesktopApp = () => {
  // const dispatch = useAppDispatch();

  // 检查是否在Electron环境中
  const isElectron = useCallback(() => {
    return window.appInfo?.isElectron || false;
  }, []);

  // 检查系统状态
  const checkSystemStatus = useCallback(async () => {
    if (!window.electronAPI) return null;
    
    try {
      const status = await window.electronAPI.checkSystemStatus();
      return status;
    } catch (error) {
      console.error('检查系统状态失败:', error);
      return null;
    }
  }, []);

  // 打开文件对话框
  const openFileDialog = useCallback(async (options: {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    properties?: string[];
  }) => {
    if (!window.electronAPI) {
      // Web环境下的文件选择
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = options.filters?.map(f => f.extensions.map(ext => `.${ext}`).join(',')).join(',') || '*';
        input.onchange = (e) => {
          const files = (e.target as HTMLInputElement).files;
          resolve({ canceled: false, filePaths: files ? Array.from(files).map(f => f.name) : [] });
        };
        input.click();
      });
    }

    try {
      return await window.electronAPI.openFileDialog(options);
    } catch (error) {
      console.error('打开文件对话框失败:', error);
      return { canceled: true, filePaths: [] };
    }
  }, []);

  // 保存文件对话框
  const saveFileDialog = useCallback(async (options: {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => {
    if (!window.electronAPI) {
      // Web环境下的文件保存
      return { canceled: true, filePath: '' };
    }

    try {
      return await window.electronAPI.saveFileDialog(options);
    } catch (error) {
      console.error('保存文件对话框失败:', error);
      return { canceled: true, filePath: '' };
    }
  }, []);

  // 显示消息框
  const showMessageBox = useCallback(async (options: {
    type?: 'info' | 'warning' | 'error' | 'question';
    title?: string;
    message: string;
    detail?: string;
    buttons?: string[];
  }) => {
    if (!window.electronAPI) {
      // Web环境下使用antd的message
      switch (options.type) {
        case 'error':
          message.error(options.message);
          break;
        case 'warning':
          message.warning(options.message);
          break;
        case 'info':
        default:
          message.info(options.message);
          break;
      }
      return { response: 0 };
    }

    try {
      return await window.electronAPI.showMessageBox(options);
    } catch (error) {
      console.error('显示消息框失败:', error);
      return { response: 0 };
    }
  }, []);

  // 重启应用
  const restartApp = useCallback(async () => {
    if (!window.electronAPI) {
      window.location.reload();
      return;
    }

    try {
      await window.electronAPI.restartApp();
    } catch (error) {
      console.error('重启应用失败:', error);
    }
  }, []);

  // 退出应用
  const quitApp = useCallback(async () => {
    if (!window.electronAPI) {
      window.close();
      return;
    }

    try {
      await window.electronAPI.quitApp();
    } catch (error) {
      console.error('退出应用失败:', error);
    }
  }, []);

  // 监听系统事件
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleSystemEvent = (channel: string, data: any) => {
      console.log('系统事件:', channel, data);
      
      switch (channel) {
        case 'backend-ready':
          message.success('后端服务启动成功');
          // 可以dispatch相关状态更新
          break;
        case 'backend-status':
          if (data.status === 'stopped') {
            message.error('后端服务已停止');
          }
          break;
        case 'backend-error':
          message.error(`后端服务错误: ${data.error}`);
          break;
        case 'menu-action':
          handleMenuAction(data.action);
          break;
        default:
          break;
      }
    };

    const handleMenuAction = (action: string) => {
      switch (action) {
        case 'new-project':
          // 触发新建项目
          window.location.hash = '/projects/new';
          break;
        case 'open-project':
          // 触发打开项目
          window.location.hash = '/projects';
          break;
        case 'save':
          // 触发保存操作
          document.dispatchEvent(new CustomEvent('app-save'));
          break;
        default:
          break;
      }
    };

    window.electronAPI.onSystemEvent(handleSystemEvent);

    return () => {
      // 清理事件监听
      const channels = ['backend-ready', 'backend-status', 'backend-error', 'menu-action'];
      channels.forEach(channel => {
        window.electronAPI?.removeAllListeners(channel);
      });
    };
  }, []);

  // 初始化检查
  useEffect(() => {
    if (isElectron()) {
      checkSystemStatus().then(status => {
        if (status) {
          console.log('系统状态:', status);
        }
      });
    }
  }, [isElectron, checkSystemStatus]);

  return {
    isElectron: isElectron(),
    checkSystemStatus,
    openFileDialog,
    saveFileDialog,
    showMessageBox,
    restartApp,
    quitApp,
    appInfo: window.appInfo
  };
};
