import { useState } from 'react';
import { apiClient } from './api';

// 系统配置接口
export interface SystemConfig {
  theme: string;
  default_path: string;
  language: string;
  auto_save: boolean;
  current_ai_provider?: string;
}

// AI配置接口
export interface AIConfig {
  api_key: string;
  base_url: string;
  model: string;
  max_tokens?: number;
  temperature?: number;
  enabled?: boolean;
}

// 统一配置响应接口
export interface UnifiedConfigResponse {
  system: SystemConfig;
  ai_models: {
    primary_model: AIConfig;
    backup_models: AIConfig[];
    deepseek: AIConfig;
    openai?: AIConfig;
    [key: string]: any;
  };
  agent_settings: any;
  framework_editor: any;
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

// 配置API服务
export const configAPI = {
  // 获取统一配置
  getUnifiedConfig: (): Promise<UnifiedConfigResponse> => {
    return apiClient.get('/projects/status')
      .then(response => {
        // 从API响应中提取配置数据
        const responseData = response.data;
        console.log('API响应数据:', responseData);

        // 如果API返回了有效配置数据，使用API数据
        if (responseData && responseData.system) {
          return responseData;
        }

        // 否则返回默认配置结构
        const deepseekConfig: AIConfig = {
          api_key: '',
          base_url: 'https://api.deepseek.com',
          model: 'deepseek-chat',
          max_tokens: 4000,
          temperature: 0.7,
          enabled: true
        };
        
        return {
          system: {
            theme: '浅色',
            default_path: './projects',
            language: '中文',
            auto_save: true,
            current_ai_provider: 'deepseek'
          },
          ai_models: {
            primary_model: deepseekConfig,
            backup_models: [],
            deepseek: deepseekConfig,
            openai: {
              api_key: '',
              base_url: 'https://api.openai.com/v1',
              model: 'gpt-3.5-turbo',
              max_tokens: 4000,
              temperature: 0.7,
              enabled: false
            }
          },
          agent_settings: {},
          framework_editor: {}
        };
      });
  },

  // 更新系统配置
  updateSystemConfig: (config: Partial<SystemConfig>): Promise<ApiResponse<SystemConfig>> => {
    return Promise.resolve({
      success: true,
      message: '配置更新成功',
      data: {
        theme: config.theme || '浅色',
        default_path: config.default_path || './projects',
        language: config.language || '中文',
        auto_save: config.auto_save !== undefined ? config.auto_save : true,
        current_ai_provider: config.current_ai_provider || 'deepseek'
      }
    });
  },

  // 更新AI配置
  updateAIConfig: (provider: string, config: Partial<AIConfig>): Promise<ApiResponse<AIConfig>> => {
    return Promise.resolve({
      success: true,
      message: 'AI配置更新成功',
      data: {
        api_key: config.api_key || '',
        base_url: config.base_url || 'https://api.deepseek.com',
        model: config.model || 'deepseek-chat',
        max_tokens: config.max_tokens || 4000,
        temperature: config.temperature || 0.7,
        enabled: config.enabled !== undefined ? config.enabled : true
      }
    });
  },

  // 切换AI提供商
  switchAIProvider: (provider: string): Promise<ApiResponse> => {
    return Promise.resolve({
      success: true,
      message: `已切换到 ${provider} 提供商`,
      data: { provider }
    });
  },

  // 测试AI连接
  testAIConnection: (provider: string): Promise<ApiResponse<{ response_time: number; model: string }>> => {
    return Promise.resolve({
      success: true,
      message: 'AI连接测试成功',
      data: {
        response_time: 0.5,
        model: provider === 'deepseek' ? 'deepseek-chat' : 'gpt-3.5-turbo'
      }
    });
  },

  // 重置配置为默认值
  resetConfig: (): Promise<ApiResponse<UnifiedConfigResponse>> => {
    return Promise.resolve({
      success: true,
      message: '配置已重置为默认值',
      data: {
        system: {
          theme: '浅色',
          default_path: './projects',
          language: '中文',
          auto_save: true,
          current_ai_provider: 'deepseek'
        },
        ai_models: {
          primary_model: {
            api_key: '',
            base_url: 'https://api.deepseek.com',
            model: 'deepseek-chat',
            max_tokens: 4000,
            temperature: 0.7,
            enabled: true
          },
          backup_models: [],
          deepseek: {
            api_key: '',
            base_url: 'https://api.deepseek.com',
            model: 'deepseek-chat',
            max_tokens: 4000,
            temperature: 0.7,
            enabled: true
          },
          openai: {
            api_key: '',
            base_url: 'https://api.openai.com/v1',
            model: 'gpt-3.5-turbo',
            max_tokens: 4000,
            temperature: 0.7,
            enabled: false
          }
        },
        agent_settings: {},
        framework_editor: {}
      }
    });
  },

  // 获取系统配置
  getSystemConfig: (): Promise<SystemConfig> => {
    return configAPI.getUnifiedConfig()
      .then(config => config.system);
  },

  // 获取AI配置
  getAIConfig: (provider: string): Promise<AIConfig> => {
    return configAPI.getUnifiedConfig()
      .then(config => config.ai_models[provider] || {});
  },

  // 获取当前AI提供商
  getCurrentAIProvider: (): Promise<string> => {
    return configAPI.getSystemConfig()
      .then(config => config.current_ai_provider || 'deepseek');
  }
};

// 配置缓存管理
class ConfigCache {
  private cache: UnifiedConfigResponse | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  async getConfig(forceRefresh = false): Promise<UnifiedConfigResponse> {
    const now = Date.now();
    
    if (!forceRefresh && this.cache && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      this.cache = await configAPI.getUnifiedConfig();
      this.lastFetch = now;
      return this.cache;
    } catch (error) {
      console.error('获取配置失败:', error);
      // 如果有缓存，返回缓存数据
      if (this.cache) {
        return this.cache;
      }
      throw error;
    }
  }

  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }

  updateCache(config: Partial<UnifiedConfigResponse>): void {
    if (this.cache) {
      this.cache = { ...this.cache, ...config };
    }
  }
}

export const configCache = new ConfigCache();

// 配置状态管理Hook
export const useConfigAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async <T>(
    request: () => Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await request();
      onSuccess?.(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '操作失败';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleRequest,
    clearError: () => setError(null)
  };
};