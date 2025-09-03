/**
 * 双模式AI管理器
 * 智能切换本地AI模型和远程API服务
 */

import { configAPI } from './configAPI';
import { apiClient } from './api';

export type AIMode = 'local' | 'remote' | 'hybrid';
export type AIProvider = 'deepseek' | 'openai' | 'local' | 'custom';

export interface AIConfig {
  mode: AIMode;
  provider: AIProvider;
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  source: 'local' | 'remote';
  responseTime: number;
  tokensUsed?: number;
}

export interface NetworkStatus {
  online: boolean;
  speed: 'fast' | 'slow' | 'offline';
  latency: number;
}

class AIModeManager {
  private currentConfig: AIConfig;
  private networkStatus: NetworkStatus;
  private localModelAvailable: boolean = false;
  private remoteAPIAvailable: boolean = false;

  constructor() {
    this.currentConfig = this.getDefaultConfig();
    this.networkStatus = { online: true, speed: 'fast', latency: 0 };
    this.initializeAIServices();
  }

  // 获取默认配置
  private getDefaultConfig(): AIConfig {
    return {
      mode: 'hybrid',
      provider: 'deepseek',
      apiKey: '',
      apiUrl: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30000, // 30秒超时
    };
  }

  // 初始化AI服务
  private async initializeAIServices(): Promise<void> {
    try {
      // 加载配置
      await this.loadConfig();

      // 检查网络状态
      await this.checkNetworkStatus();

      // 检查本地模型可用性
      await this.checkLocalModelAvailability();

      // 检查远程API可用性
      await this.checkRemoteAPIAvailability();

      // 根据可用性调整模式
      this.adjustModeBasedOnAvailability();
    } catch (error) {
      console.error('初始化AI服务失败:', error);
    }
  }

  // 加载AI配置
  private async loadConfig(): Promise<void> {
    try {
      const config = await configAPI.getUnifiedConfig();
      const currentProvider = config.system?.current_ai_provider || 'deepseek';
      const aiConfig = config.ai_models?.[currentProvider];

      if (aiConfig) {
        this.currentConfig = {
          mode: 'hybrid',
          provider: currentProvider as AIProvider,
          apiKey: aiConfig.api_key,
          apiUrl: aiConfig.base_url,
          model: aiConfig.model,
          temperature: aiConfig.temperature || 0.7,
          maxTokens: aiConfig.max_tokens || 2000,
          timeout: 30000,
        };
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      // 使用默认配置
      this.currentConfig = this.getDefaultConfig();
    }
  }

  // 保存AI配置
  async saveConfig(config: Partial<AIConfig>): Promise<boolean> {
    try {
      this.currentConfig = { ...this.currentConfig, ...config };

      // 如果切换了提供商，更新系统配置
      if (config.provider) {
        await configAPI.switchAIProvider(config.provider);
      }

      // 更新AI配置
      if (config.provider) {
        const aiConfigData = {
          api_key: this.currentConfig.apiKey,
          base_url: this.currentConfig.apiUrl,
          model: this.currentConfig.model,
          temperature: this.currentConfig.temperature,
          max_tokens: this.currentConfig.maxTokens,
          enabled: true
        };

        await configAPI.updateAIConfig(config.provider, aiConfigData);
      }

      return true;
    } catch (error) {
      console.error('保存AI配置失败:', error);
      return false;
    }
  }

  // 检查网络状态
  private async checkNetworkStatus(): Promise<void> {
    try {
      const startTime = Date.now();

      // 在Electron环境中，检查本地后端服务
      const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');

      if (isElectron) {
        // 检查本地后端服务
        try {
          const healthStartTime = Date.now();
          // 使用配置的API客户端检查健康状态
          const response = await apiClient.get('/health');
          const latency = Date.now() - healthStartTime;

          if (response.success) {
            this.networkStatus = {
              online: true,
              speed: latency < 500 ? 'fast' : 'slow',
              latency,
            };
            console.log(`后端服务连接正常，延迟: ${latency}ms`);
          } else {
            throw new Error('Backend service not available');
          }
        } catch (error) {
          console.warn('后端服务检测失败:', error);
          // 后端服务不可用，但网络可能正常
          this.networkStatus = {
            online: navigator.onLine,
            speed: 'offline',
            latency: -1,
          };
        }
      } else {
        // 浏览器环境，使用navigator.onLine
        this.networkStatus = {
          online: navigator.onLine,
          speed: navigator.onLine ? 'fast' : 'offline',
          latency: navigator.onLine ? 100 : -1,
        };
      }
    } catch (error) {
      console.error('网络状态检测失败:', error);
      this.networkStatus = {
        online: false,
        speed: 'offline',
        latency: -1,
      };
    }
  }

  // 检查本地模型可用性
  private async checkLocalModelAvailability(): Promise<void> {
    try {
      // 检查是否有本地AI服务运行
      if (window.electronAPI) {
        // 桌面应用中检查本地AI服务
        try {
          const status = await window.electronAPI.checkSystemStatus();
          this.localModelAvailable = status?.backend || false;
          console.log('通过ElectronAPI检查本地服务:', this.localModelAvailable);
        } catch (error) {
          console.warn('ElectronAPI调用失败，尝试直接检查后端服务:', error);
          // 如果electronAPI调用失败，尝试使用API客户端检查后端服务
          try {
            const response = await apiClient.get('/health');
            this.localModelAvailable = response.success;
            console.log('通过API客户端检查后端服务结果:', this.localModelAvailable);
          } catch (fetchError) {
            console.warn('通过API客户端检查后端服务失败:', fetchError);
            this.localModelAvailable = false;
          }
        }
      } else {
        // Web环境中检查本地后端服务
        try {
          const response = await apiClient.get('/health');
          this.localModelAvailable = response.success;
          console.log('Web环境通过API客户端检查本地服务结果:', this.localModelAvailable);
        } catch (error) {
          console.warn('Web环境通过API客户端检查本地服务失败:', error);
          this.localModelAvailable = false;
        }
      }
    } catch (error) {
      console.error('检查本地模型失败:', error);
      this.localModelAvailable = false;
    }
  }

  // 检查远程API可用性
  private async checkRemoteAPIAvailability(): Promise<void> {
    try {
      if (!this.currentConfig.apiKey || !this.networkStatus.online) {
        this.remoteAPIAvailable = false;
        return;
      }

      // 测试API连接
      const testResult = await this.testRemoteAPI();
      this.remoteAPIAvailable = testResult.success;
    } catch (error) {
      console.error('检查远程API失败:', error);
      this.remoteAPIAvailable = false;
    }
  }

  // 测试远程API
  private async testRemoteAPI(): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const apiUrl = this.getAPIUrl();
      const headers = this.getAPIHeaders();

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.currentConfig.model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10,
        }),
        signal: AbortSignal.timeout(this.currentConfig.timeout || 30000),
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          source: 'remote',
          responseTime,
        };
      } else {
        throw new Error(`API请求失败: ${response.status}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        source: 'remote',
        responseTime: Date.now() - startTime,
      };
    }
  }

  // 根据可用性调整模式
  private adjustModeBasedOnAvailability(): void {
    const statusInfo = {
      network: this.networkStatus.online,
      networkSpeed: this.networkStatus.speed,
      localModel: this.localModelAvailable,
      remoteAPI: this.remoteAPIAvailable,
      mode: this.currentConfig.mode,
    };

    console.log('AI服务状态检查结果:', statusInfo);

    if (this.currentConfig.mode === 'hybrid') {
      // 混合模式下根据可用性智能选择
      if (!this.networkStatus.online) {
        if (this.localModelAvailable) {
          console.log('✅ 网络离线，使用本地AI服务');
        } else {
          console.warn('⚠️ 网络离线且本地AI不可用');
        }
      } else if (!this.remoteAPIAvailable) {
        if (this.localModelAvailable) {
          console.log('✅ 远程API不可用，使用本地AI服务');
        } else {
          console.warn('⚠️ 远程API和本地AI都不可用');
        }
      } else if (this.localModelAvailable && this.remoteAPIAvailable) {
        console.log('✅ 本地和远程AI都可用，使用混合模式');
      } else if (this.localModelAvailable) {
        console.log('✅ 仅本地AI可用，使用本地模式');
      } else if (this.remoteAPIAvailable) {
        console.log('✅ 仅远程AI可用，使用远程模式');
      } else {
        console.error('❌ 本地和远程AI都不可用');
      }
    } else if (this.currentConfig.mode === 'local') {
      if (this.localModelAvailable) {
        console.log('✅ 本地AI模式已启用');
      } else {
        console.warn('⚠️ 本地AI不可用，但配置为本地模式');
      }
    } else if (this.currentConfig.mode === 'remote') {
      if (this.remoteAPIAvailable) {
        console.log('✅ 远程AI模式已启用');
      } else {
        console.warn('⚠️ 远程API不可用，但配置为远程模式');
      }
    }
  }

  // 获取API URL
  private getAPIUrl(): string {
    if (this.currentConfig.apiUrl) {
      return this.currentConfig.apiUrl;
    }

    switch (this.currentConfig.provider) {
      case 'deepseek':
        return 'https://api.deepseek.com/v1/chat/completions';
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions';
      default:
        return 'http://localhost:9958/api/ai/chat';
    }
  }

  // 获取API请求头
  private getAPIHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.currentConfig.apiKey) {
      headers['Authorization'] = `Bearer ${this.currentConfig.apiKey}`;
    }

    return headers;
  }

  // 智能选择AI服务
  private selectAIService(): 'local' | 'remote' {
    switch (this.currentConfig.mode) {
      case 'local':
        return 'local';
      case 'remote':
        return 'remote';
      case 'hybrid':
        // 混合模式智能选择
        if (!this.networkStatus.online || this.networkStatus.speed === 'slow') {
          return this.localModelAvailable ? 'local' : 'remote';
        }
        if (!this.remoteAPIAvailable) {
          return 'local';
        }
        if (!this.localModelAvailable) {
          return 'remote';
        }
        // 都可用时优先使用远程（功能更强）
        return 'remote';
      default:
        return 'remote';
    }
  }

  // 发送AI请求
  async sendRequest(messages: any[], options?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }): Promise<AIResponse> {
    const service = this.selectAIService();
    
    if (service === 'local') {
      return this.sendLocalRequest(messages, options);
    } else {
      return this.sendRemoteRequest(messages, options);
    }
  }

  // 发送本地AI请求
  private async sendLocalRequest(messages: any[], options?: any): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      if (!this.localModelAvailable) {
        throw new Error('本地AI模型不可用');
      }

      // 通过后端API发送请求
      const response = await apiClient.post('/ai/local/chat', {
        messages,
        temperature: options?.temperature || this.currentConfig.temperature,
        max_tokens: options?.maxTokens || this.currentConfig.maxTokens,
      });

      const responseTime = Date.now() - startTime;

      if (response.success) {
        return {
          success: true,
          data: response.data,
          source: 'local',
          responseTime,
        };
      } else {
        throw new Error(`本地AI请求失败: ${response.message || '未知错误'}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '本地AI请求失败',
        source: 'local',
        responseTime: Date.now() - startTime,
      };
    }
  }

  // 发送远程AI请求
  private async sendRemoteRequest(messages: any[], options?: any): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      if (!this.remoteAPIAvailable) {
        throw new Error('远程AI服务不可用');
      }

      const apiUrl = this.getAPIUrl();
      const headers = this.getAPIHeaders();

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.currentConfig.model,
          messages,
          temperature: options?.temperature || this.currentConfig.temperature,
          max_tokens: options?.maxTokens || this.currentConfig.maxTokens,
          stream: options?.stream || false,
        }),
        signal: AbortSignal.timeout(this.currentConfig.timeout || 30000),
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data,
          source: 'remote',
          responseTime,
          tokensUsed: data.usage?.total_tokens,
        };
      } else {
        throw new Error(`远程AI请求失败: ${response.status}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '远程AI请求失败',
        source: 'remote',
        responseTime: Date.now() - startTime,
      };
    }
  }

  // 获取当前状态
  getStatus(): {
    mode: AIMode;
    provider: AIProvider;
    localAvailable: boolean;
    remoteAvailable: boolean;
    networkStatus: NetworkStatus;
    currentService: 'local' | 'remote';
  } {
    return {
      mode: this.currentConfig.mode,
      provider: this.currentConfig.provider,
      localAvailable: this.localModelAvailable,
      remoteAvailable: this.remoteAPIAvailable,
      networkStatus: this.networkStatus,
      currentService: this.selectAIService(),
    };
  }

  // 切换AI模式
  async switchMode(mode: AIMode): Promise<boolean> {
    try {
      this.currentConfig.mode = mode;
      await this.initializeAIServices();
      return this.saveConfig({ mode });
    } catch (error) {
      console.error('切换AI模式失败:', error);
      return false;
    }
  }

  // 刷新服务状态
  async refreshStatus(): Promise<void> {
    await this.initializeAIServices();
  }
}

// 导出单例实例
export const aiModeManager = new AIModeManager();
export default aiModeManager;
